import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { MailModule } from "../mail/mail.module";
import { AgencyLandlordsController } from "./agency-landlords.controller";
import { AgencyLandlordsService } from "./agency-landlords.service";

@Module({
  imports: [AuthModule, MailModule],
  controllers: [AgencyLandlordsController],
  providers: [AgencyLandlordsService],
})
export class AgencyLandlordsModule {}