import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model, Types } from 'mongoose';
import { SYSTEM_ROLE_PERMISSIONS } from './common/constants/permissions';
import { SystemRole } from './common/enums';
import { AppModule } from './app.module';
import { Role, RoleDocument } from './modules/roles/schemas/role.schema';
import { Tenant, TenantDocument } from './modules/tenants/schemas/tenant.schema';
import { User, UserDocument } from './modules/users/schemas/user.schema';

const BCRYPT_ROUNDS = 12;

const demoUsers = [
  {
    firstName: 'Hospital',
    lastName: 'Admin',
    email: 'admin@cgh.local',
    password: 'Admin@123',
    role: SystemRole.HOSPITAL_ADMIN,
  },
  {
    firstName: 'Asha',
    lastName: 'Mehra',
    email: 'dr.asha@cgh.local',
    password: 'Doctor@123',
    role: SystemRole.DOCTOR,
  },
  {
    firstName: 'Front',
    lastName: 'Desk',
    email: 'reception@cgh.local',
    password: 'Front@123',
    role: SystemRole.RECEPTIONIST,
  },
  {
    firstName: 'Accounts',
    lastName: 'Team',
    email: 'accounts@cgh.local',
    password: 'Money@123',
    role: SystemRole.ACCOUNTANT,
  },
  {
    firstName: 'Pharma',
    lastName: 'Desk',
    email: 'pharmacy@cgh.local',
    password: 'Pharma@123',
    role: SystemRole.PHARMACIST,
  },
  {
    firstName: 'Lab',
    lastName: 'Tech',
    email: 'lab@cgh.local',
    password: 'Lab@123',
    role: SystemRole.LAB_TECHNICIAN,
  },
  {
    firstName: 'Radiology',
    lastName: 'Tech',
    email: 'radiology@cgh.local',
    password: 'Radio@123',
    role: SystemRole.RADIOLOGIST,
  },
  {
    firstName: 'Store',
    lastName: 'Keeper',
    email: 'inventory@cgh.local',
    password: 'Store@123',
    role: SystemRole.INVENTORY_MANAGER,
  },
];

async function bootstrap(): Promise<void> {
  process.env.MONGODB_URI ??= 'mongodb://localhost:27017/hms';
  process.env.JWT_ACCESS_SECRET ??= 'change-me-access-secret';
  process.env.JWT_REFRESH_SECRET ??= 'change-me-refresh-secret';

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'warn', 'error'] });
  const roles = app.get<Model<RoleDocument>>(getModelToken(Role.name));
  const tenants = app.get<Model<TenantDocument>>(getModelToken(Tenant.name));
  const users = app.get<Model<UserDocument>>(getModelToken(User.name));

  try {
    await seedRoles(roles);
    const tenant = await seedTenant(tenants);
    await seedSuperAdmin(users);
    await seedTenantUsers(users, tenant._id);
  } finally {
    await app.close();
  }
}

async function seedRoles(roles: Model<RoleDocument>): Promise<void> {
  await Promise.all(
    Object.entries(SYSTEM_ROLE_PERMISSIONS).map(([name, permissions]) =>
      roles
        .updateOne(
          { name, isSystem: true },
          { $set: { name, permissions, isSystem: true, tenantId: null } },
          { upsert: true },
        )
        .exec(),
    ),
  );
}

async function seedTenant(tenants: Model<TenantDocument>): Promise<TenantDocument> {
  const tenant = await tenants
    .findOneAndUpdate(
      { code: 'CGH' },
      {
        $set: {
          name: 'City General Hospital',
          code: 'CGH',
          phone: '+91-9876543210',
          email: 'hello@cgh.local',
          address: { line1: 'MG Road', city: 'Pune', state: 'Maharashtra', pincode: '411001' },
          gstin: '27ABCDE1234F1Z5',
          isActive: true,
        },
      },
      { upsert: true, new: true },
    )
    .exec();
  if (!tenant) throw new Error('Failed to seed demo hospital');
  return tenant;
}

async function seedSuperAdmin(users: Model<UserDocument>): Promise<void> {
  await upsertUser(users, null, {
    firstName: 'Super',
    lastName: 'Admin',
    email: 'superadmin@hms.local',
    password: 'Admin@123',
    role: SystemRole.SUPER_ADMIN,
  });
}

async function seedTenantUsers(users: Model<UserDocument>, tenantId: Types.ObjectId): Promise<void> {
  await Promise.all(demoUsers.map((user) => upsertUser(users, tenantId, user)));
}

async function upsertUser(
  users: Model<UserDocument>,
  tenantId: Types.ObjectId | null,
  user: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: SystemRole;
  },
): Promise<void> {
  const passwordHash = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
  await users
    .updateOne(
      { tenantId, email: user.email },
      {
        $set: {
          tenantId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          passwordHash,
          isActive: true,
        },
        $setOnInsert: { refreshTokenHash: null },
      },
      { upsert: true },
    )
    .exec();
}

void bootstrap()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('Seed complete: demo hospital CGH, system roles, and demo users are ready.');
    process.exit(0);
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
