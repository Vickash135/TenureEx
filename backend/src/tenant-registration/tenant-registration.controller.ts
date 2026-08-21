import { Body, Controller, Post } from "@nestjs/common";
import { CompleteTenantRegistrationDto } from "./dto/complete-tenant-registration.dto";
import { StartTenantRegistrationDto } from "./dto/start-tenant-registration.dto";
import { VerifyTenantEmailDto } from "./dto/verify-tenant-email.dto";
import { TenantRegistrationService } from "./tenant-registration.service";

@Controller("tenant-registration")
export class TenantRegistrationController {
  constructor(private readonly service: TenantRegistrationService) {}

  @Post("start")
  start(@Body() dto: StartTenantRegistrationDto) {
    return this.service.start(dto);
  }

  @Post("verify-email")
  verifyEmail(@Body() dto: VerifyTenantEmailDto) {
    return this.service.verifyEmail(dto);
  }

  @Post("complete")
  complete(@Body() dto: CompleteTenantRegistrationDto) {
    return this.service.complete(dto);
  }
}
