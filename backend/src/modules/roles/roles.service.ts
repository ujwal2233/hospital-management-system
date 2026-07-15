import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ALL_PERMISSIONS } from '../../common/constants/permissions';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role, RoleDocument } from './schemas/role.schema';

@Injectable()
export class RolesService {
  constructor(@InjectModel(Role.name) private readonly model: Model<RoleDocument>) {}

  permissionCatalog(): string[] {
    return ALL_PERMISSIONS;
  }

  /** System roles + the tenant's custom roles. */
  findAllForTenant(tenantId: string | null): Promise<Role[]> {
    const or: Record<string, unknown>[] = [{ isSystem: true }];
    if (tenantId) or.push({ tenantId: new Types.ObjectId(tenantId) });
    return this.model.find({ $or: or }).sort({ isSystem: -1, name: 1 }).lean().exec();
  }

  /** Resolve a role by name for a user's tenant (system roles are global). */
  async resolve(name: string, tenantId: string | null): Promise<Role | null> {
    return this.model
      .findOne({
        name,
        $or: [
          { isSystem: true },
          ...(tenantId ? [{ tenantId: new Types.ObjectId(tenantId) }] : []),
        ],
      })
      .lean()
      .exec();
  }

  async create(user: AuthUser, dto: CreateRoleDto): Promise<Role> {
    if (!user.tenantId) {
      throw new BadRequestException('Custom roles must be created within a hospital context');
    }
    const existing = await this.resolve(dto.name, user.tenantId);
    if (existing) throw new ConflictException(`Role ${dto.name} already exists`);
    return this.model.create({ ...dto, tenantId: new Types.ObjectId(user.tenantId), isSystem: false });
  }

  async update(user: AuthUser, id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findCustomRole(user, id);
    Object.assign(role, dto);
    await role.save();
    return role.toObject();
  }

  async remove(user: AuthUser, id: string): Promise<void> {
    const role = await this.findCustomRole(user, id);
    await role.deleteOne();
  }

  private async findCustomRole(user: AuthUser, id: string): Promise<RoleDocument> {
    const role = await this.model.findById(id).exec();
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new BadRequestException('System roles cannot be modified');
    if (user.tenantId && role.tenantId?.toString() !== user.tenantId) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }
}
