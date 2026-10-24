import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstimateRequest } from './estimate-request.entity';
import { EstimateImage } from './estimate-image.entity';
import { InquiriesService } from './inquiries.service';
import { AdminEstimateRequestsController, EstimateRequestsController, PublicUploadsController } from './inquiries.controller';
import { SettingsModule } from '../settings/settings.module';
import { ContentModule } from '../content/content.module';
import { ServicesModule } from '../services/services.module';

/** Estimate requests (leads) + inspiration photos. Module keeps the canonical "inquiries" name. */
@Module({
  imports: [TypeOrmModule.forFeature([EstimateRequest, EstimateImage]), SettingsModule, ContentModule, ServicesModule],
  providers: [InquiriesService],
  controllers: [EstimateRequestsController, PublicUploadsController, AdminEstimateRequestsController],
})
export class InquiriesModule {}
