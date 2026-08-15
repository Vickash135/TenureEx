import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser, type AuthenticatedUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AgencyLandlordsService } from "./agency-landlords.service";
import { InviteLandlordDto } from "./dto/invite-landlord.dto";
import { RejectPropertyDto } from "./dto/reject-property.dto";

@Controller("agency-landlords")
@UseGuards(JwtAuthGuard)
export class AgencyLandlordsController {
  constructor(private readonly service: AgencyLandlordsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listLandlords(user.sub);
  }

  @Post("invite")
  invite(@CurrentUser() user: AuthenticatedUser, @Body() dto: InviteLandlordDto) {
    return this.service.inviteLandlord(user.sub, dto);
  }

  @Get("properties")
  properties(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listProperties(user.sub);
  }

  @Get("properties/:id")
  property(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.service.getProperty(user.sub, id);
  }

  @Patch("properties/:id/approve")
  approve(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.service.approveProperty(user.sub, id);
  }

  @Patch("properties/:id/reject")
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: RejectPropertyDto,
  ) {
    return this.service.rejectProperty(user.sub, id, dto.reason);
  }
}
