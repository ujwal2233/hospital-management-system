import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InsuranceController } from './insurance.controller';
import { InsuranceService } from './insurance.service';
import {
  InsuranceClaim,
  InsuranceClaimSchema,
  InsuranceProvider,
  InsuranceProviderSchema,
} from './schemas/insurance.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InsuranceProvider.name, schema: InsuranceProviderSchema },
      { name: InsuranceClaim.name, schema: InsuranceClaimSchema },
    ]),
  ],
  controllers: [InsuranceController],
  providers: [InsuranceService],
  exports: [InsuranceService],
})
export class InsuranceModule {}
