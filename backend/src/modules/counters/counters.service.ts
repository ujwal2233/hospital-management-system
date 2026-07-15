import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Counter, CounterDocument } from './schemas/counter.schema';

/** Atomic per-tenant sequence generator (MRN, invoice numbers, queue tokens). */
@Injectable()
export class CountersService {
  constructor(@InjectModel(Counter.name) private readonly model: Model<CounterDocument>) {}

  async next(tenantId: string, key: string): Promise<number> {
    const doc = await this.model
      .findOneAndUpdate(
        { tenantId: new Types.ObjectId(tenantId), key },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      )
      .lean()
      .exec();
    return doc.seq;
  }
}
