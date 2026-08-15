import { Module } from "@nestjs/common";

import { MailModule } from "../mail/mail.module";
import { LandlordRegistrationController } from "./landlord-registration.controller";
import { LandlordRegistrationService } from "./landlord-registration.service";

@Module({
  imports: [MailModule],

  controllers: [
    LandlordRegistrationController,
  ],

  providers: [
    LandlordRegistrationService,
  ],

  exports: [
    LandlordRegistrationService,
  ],
})
export class LandlordRegistrationModule {}
