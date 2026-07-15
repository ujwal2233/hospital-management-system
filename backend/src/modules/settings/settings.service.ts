import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { requireTenant, tenantFilter } from '../../common/utils/tenant';
import { Setting, SettingDocument } from './schemas/setting.schema';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Setting.name) private readonly model: Model<SettingDocument>,
  ) {}

  async findAll(user: AuthUser): Promise<Record<string, unknown>> {
    const settings = await this.model.find(tenantFilter(user)).lean().exec();
    return settings.reduce<Record<string, unknown>>((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
  }

  async upsertMany(
    user: AuthUser,
    patch: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const tenantId = requireTenant(user);
    await Promise.all(
      Object.entries(patch).map(([key, value]) =>
        this.model
          .updateOne({ tenantId, key }, { $set: { tenantId, key, value } }, { upsert: true })
          .exec(),
      ),
    );
    return this.findAll(user);
  }
}
