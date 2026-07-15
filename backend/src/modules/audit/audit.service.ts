import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { SystemRole } from '../../common/enums';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { paginate, Paginated } from '../../common/utils/pagination';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

export interface AuditEntry {
  tenantId: string | null;
  userId: string | null;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  path: string;
  ip?: string;
  statusCode: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@InjectModel(AuditLog.name) private readonly model: Model<AuditLogDocument>) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.model.create({
        ...entry,
        tenantId: entry.tenantId ? new Types.ObjectId(entry.tenantId) : null,
        userId: entry.userId ? new Types.ObjectId(entry.userId) : null,
      });
    } catch (err) {
      // Audit failures must never break the request path.
      this.logger.warn(`Failed to write audit log: ${(err as Error).message}`);
    }
  }

  findAll(user: AuthUser, query: PaginationQueryDto): Promise<Paginated<AuditLog>> {
    const filter: FilterQuery<AuditLogDocument> = {};
    if (user.role !== SystemRole.SUPER_ADMIN || user.tenantId) {
      filter.tenantId = new Types.ObjectId(user.tenantId as string);
    }
    if (query.search) {
      filter.$or = [
        { action: { $regex: query.search, $options: 'i' } },
        { userEmail: { $regex: query.search, $options: 'i' } },
        { resource: { $regex: query.search, $options: 'i' } },
      ];
    }
    return paginate(this.model, filter, query, {
      sort: { createdAt: -1 },
      populate: [{ path: 'userId', select: 'firstName lastName email' }],
    });
  }
}
