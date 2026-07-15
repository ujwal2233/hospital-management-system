import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { ClaimStatus } from '../../common/enums';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { paginate, Paginated } from '../../common/utils/pagination';
import { requireTenant, tenantFilter } from '../../common/utils/tenant';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateClaimDto, CreateProviderDto, UpdateClaimDto, UpdateProviderDto } from './dto/insurance.dto';
import {
  InsuranceClaim,
  InsuranceClaimDocument,
  InsuranceProvider,
  InsuranceProviderDocument,
} from './schemas/insurance.schema';

@Injectable()
export class InsuranceService {
  constructor(
    @InjectModel(InsuranceProvider.name)
    private readonly providerModel: Model<InsuranceProviderDocument>,
    @InjectModel(InsuranceClaim.name)
    private readonly claimModel: Model<InsuranceClaimDocument>,
  ) {}

  // Providers
  createProvider(user: AuthUser, dto: CreateProviderDto): Promise<InsuranceProvider> {
    const tenantId = requireTenant(user);
    return this.providerModel.create({ ...dto, tenantId });
  }

  findAllProviders(user: AuthUser, query: PaginationQueryDto): Promise<Paginated<InsuranceProvider>> {
    return paginate<InsuranceProvider>(this.providerModel, tenantFilter(user), query);
  }

  async updateProvider(user: AuthUser, id: string, dto: UpdateProviderDto): Promise<InsuranceProvider> {
    const p = await this.providerModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), ...tenantFilter(user) },
        { $set: dto },
        { new: true },
      )
      .lean()
      .exec();
    if (!p) throw new NotFoundException('Insurance provider not found');
    return p;
  }

  // Claims
  createClaim(user: AuthUser, dto: CreateClaimDto): Promise<InsuranceClaim> {
    const tenantId = requireTenant(user);
    return this.claimModel.create({
      tenantId,
      patientId: new Types.ObjectId(dto.patientId),
      invoiceId: new Types.ObjectId(dto.invoiceId),
      providerId: new Types.ObjectId(dto.providerId),
      policyNumber: dto.policyNumber,
      claimedAmount: dto.claimedAmount,
      remarks: dto.remarks,
    });
  }

  findAllClaims(user: AuthUser, query: PaginationQueryDto & { patientId?: string; status?: ClaimStatus }): Promise<Paginated<InsuranceClaim>> {
    const filter: FilterQuery<InsuranceClaimDocument> = { ...tenantFilter(user) };
    if (query.patientId) filter.patientId = new Types.ObjectId(query.patientId);
    if (query.status) filter.status = query.status;
    return paginate(this.claimModel, filter, query, {
      sort: { createdAt: -1 },
      populate: [
        { path: 'patientId', select: 'firstName lastName mrn' },
        { path: 'providerId', select: 'name tpaCode' },
        { path: 'invoiceId', select: 'invoiceNumber total' },
      ],
    });
  }

  async findOneClaim(user: AuthUser, id: string): Promise<InsuranceClaim> {
    const claim = await this.claimModel
      .findOne({ _id: new Types.ObjectId(id), ...tenantFilter(user) })
      .populate([
        { path: 'patientId', select: 'firstName lastName mrn phone' },
        { path: 'providerId', select: 'name tpaCode contactPerson contactPhone' },
        { path: 'invoiceId', select: 'invoiceNumber total status' },
      ])
      .lean()
      .exec();
    if (!claim) throw new NotFoundException('Insurance claim not found');
    return claim;
  }

  async updateClaim(user: AuthUser, id: string, dto: UpdateClaimDto): Promise<InsuranceClaim> {
    const updates: Record<string, unknown> = { ...dto };
    if (dto.status === ClaimStatus.PAID || dto.status === ClaimStatus.APPROVED) {
      updates.settledAt = new Date();
    }
    const claim = await this.claimModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), ...tenantFilter(user) },
        { $set: updates },
        { new: true },
      )
      .lean()
      .exec();
    if (!claim) throw new NotFoundException('Insurance claim not found');
    return claim;
  }
}
