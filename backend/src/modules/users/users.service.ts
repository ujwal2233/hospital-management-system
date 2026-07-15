import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { FilterQuery, Model, Types } from 'mongoose';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { SystemRole } from '../../common/enums';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { paginate, Paginated } from '../../common/utils/pagination';
import { RolesService } from '../roles/roles.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly model: Model<UserDocument>,
    private readonly rolesService: RolesService,
  ) {}

  async create(actor: AuthUser, dto: CreateUserDto): Promise<Partial<User>> {
    const tenantId = this.requireTenant(actor);
    await this.assertAssignableRole(actor, dto.role, tenantId);

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const created = await this.model.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      role: dto.role,
      passwordHash,
      tenantId: new Types.ObjectId(tenantId),
    });
    return this.sanitize(created);
  }

  findAll(actor: AuthUser, query: PaginationQueryDto): Promise<Paginated<User>> {
    const filter: FilterQuery<UserDocument> = this.tenantFilter(actor);
    if (query.search) {
      filter.$or = [
        { firstName: { $regex: query.search, $options: 'i' } },
        { lastName: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }
    return paginate(this.model, filter, query);
  }

  async findOne(actor: AuthUser, id: string): Promise<User> {
    const user = await this.model
      .findOne({ _id: new Types.ObjectId(id), ...this.tenantFilter(actor) })
      .lean()
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(actor: AuthUser, id: string, dto: UpdateUserDto): Promise<Partial<User>> {
    const user = await this.model
      .findOne({ _id: new Types.ObjectId(id), ...this.tenantFilter(actor) })
      .exec();
    if (!user) throw new NotFoundException('User not found');

    if (dto.role && dto.role !== user.role) {
      await this.assertAssignableRole(actor, dto.role, user.tenantId?.toString() ?? null);
    }
    const { password, ...rest } = dto;
    Object.assign(user, rest);
    if (password) {
      user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      user.refreshTokenHash = null;
    }
    await user.save();
    return this.sanitize(user);
  }

  // ── auth support ────────────────────────────────────────────────

  findByEmailWithSecrets(email: string, tenantId: string | null): Promise<UserDocument | null> {
    return this.model
      .findOne({ email: email.toLowerCase(), tenantId: tenantId ? new Types.ObjectId(tenantId) : null })
      .select('+passwordHash +refreshTokenHash')
      .exec();
  }

  countByEmail(email: string): Promise<number> {
    return this.model.countDocuments({ email: email.toLowerCase() }).exec();
  }

  findOneByEmailAnyTenant(email: string): Promise<UserDocument | null> {
    return this.model
      .findOne({ email: email.toLowerCase() })
      .select('+passwordHash +refreshTokenHash')
      .exec();
  }

  findByIdWithSecrets(id: string): Promise<UserDocument | null> {
    return this.model.findById(id).select('+passwordHash +refreshTokenHash').exec();
  }

  async setRefreshTokenHash(id: string, hash: string | null): Promise<void> {
    await this.model.updateOne({ _id: id }, { $set: { refreshTokenHash: hash } }).exec();
  }

  /** Build the per-request AuthUser (fresh role permissions, active check). */
  async buildAuthUser(userId: string, tenantOverride?: string): Promise<AuthUser> {
    const user = await this.model.findById(userId).lean().exec();
    if (!user || !user.isActive) throw new UnauthorizedException('Account is inactive');

    const tenantId = user.tenantId?.toString() ?? null;
    const role = await this.rolesService.resolve(user.role, tenantId);
    const isSuperAdmin = user.role === SystemRole.SUPER_ADMIN;

    return {
      userId: user._id.toString(),
      tenantId: isSuperAdmin && tenantOverride ? tenantOverride : tenantId,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: role?.permissions ?? [],
    };
  }

  // ── helpers ─────────────────────────────────────────────────────

  private tenantFilter(actor: AuthUser): FilterQuery<UserDocument> {
    return actor.tenantId ? { tenantId: new Types.ObjectId(actor.tenantId) } : {};
  }

  private requireTenant(actor: AuthUser): string {
    if (!actor.tenantId) {
      throw new BadRequestException(
        'A hospital context is required (super admins: pass x-tenant-id header)',
      );
    }
    return actor.tenantId;
  }

  private async assertAssignableRole(
    actor: AuthUser,
    roleName: string,
    tenantId: string | null,
  ): Promise<void> {
    if (roleName === SystemRole.SUPER_ADMIN && actor.role !== SystemRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only a super admin can assign SUPER_ADMIN');
    }
    const role = await this.rolesService.resolve(roleName, tenantId);
    if (!role) throw new BadRequestException(`Unknown role: ${roleName}`);
  }

  private sanitize(user: UserDocument): Partial<User> {
    const obj = user.toObject() as unknown as Record<string, unknown>;
    delete obj.passwordHash;
    delete obj.refreshTokenHash;
    return obj as Partial<User>;
  }
}
