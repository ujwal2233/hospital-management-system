import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthUser } from '../interfaces/auth-user.interface';

/** Tenant scope for queries: SUPER_ADMIN without an x-tenant-id override sees all tenants. */
export function tenantFilter(user: AuthUser): { tenantId?: Types.ObjectId } {
  return user.tenantId ? { tenantId: new Types.ObjectId(user.tenantId) } : {};
}

/** Writes always require an explicit tenant context. */
export function requireTenant(user: AuthUser): Types.ObjectId {
  if (!user.tenantId) {
    throw new BadRequestException(
      'A hospital context is required (super admins: pass x-tenant-id header)',
    );
  }
  return new Types.ObjectId(user.tenantId);
}
