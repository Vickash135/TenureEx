import { Module } from "@nestjs/common";
import { MailModule } from "../mail/mail.module";
import { TenantRegistrationController } from "./tenant-registration.controller";
import { TenantRegistrationService } from "./tenant-registration.service";

@Module({
  imports: [MailModule],
  controllers: [TenantRegistrationController],
  providers: [TenantRegistrationService],
  exports: [TenantRegistrationService],
})
export class TenantRegistrationModule {}
