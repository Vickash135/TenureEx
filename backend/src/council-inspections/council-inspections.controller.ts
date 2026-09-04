import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser, type AuthenticatedUser } from "../auth/decorators/current-user.decorator";
import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CouncilInspectionsService } from "./council-inspections.service";

@Controller("council-inspections")
export class CouncilInspectionsController {
  constructor(private readonly service: CouncilInspectionsService) {}

  @Post("admin/invitations") @UseGuards(AdminAuthGuard)
  invite(@CurrentUser() user: AuthenticatedUser, @Body() body: any) { return this.service.inviteInspector(user.sub, body); }
  @Get("admin/invitations") @UseGuards(AdminAuthGuard)
  invitations() { return this.service.listInvitations(); }
  @Get("admin/inspectors") @UseGuards(AdminAuthGuard)
  adminInspectors() { return this.service.listInspectors(); }
  @Patch("admin/inspectors/:id/status") @UseGuards(AdminAuthGuard)
  inspectorStatus(@Param("id") id: string, @Body() body: any) { return this.service.updateInspectorStatus(id, body.status); }

  @Get("invitation/:token")
  invitation(@Param("token") token: string) { return this.service.getInvitation(token); }
  @Post("invitation/:token/accept")
  accept(@Param("token") token: string, @Body() body: any) { return this.service.acceptInvitation(token, body); }

  @Get("directory") @UseGuards(JwtAuthGuard)
  directory(@CurrentUser() user: AuthenticatedUser) { return this.service.directory(user); }
  @Get("properties") @UseGuards(JwtAuthGuard)
  properties(@CurrentUser() user: AuthenticatedUser) { return this.service.accessibleProperties(user); }
  @Post("cases") @UseGuards(JwtAuthGuard)
  createCase(@CurrentUser() user: AuthenticatedUser, @Body() body: any) { return this.service.createCase(user, body); }
  @Get("cases") @UseGuards(JwtAuthGuard)
  cases(@CurrentUser() user: AuthenticatedUser, @Query("status") status?: string) { return this.service.listCases(user, status); }
  @Get("cases/:id") @UseGuards(JwtAuthGuard)
  caseDetails(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) { return this.service.getCase(user, id); }
  @Post("cases/:id/accept") @UseGuards(JwtAuthGuard)
  acceptCase(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) { return this.service.acceptCase(user, id); }
  @Post("cases/:id/decline") @UseGuards(JwtAuthGuard)
  declineCase(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() body: any) { return this.service.declineCase(user, id, body.reason); }
  @Patch("cases/:id/schedule") @UseGuards(JwtAuthGuard)
  schedule(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() body: any) { return this.service.scheduleCase(user, id, body); }
  @Patch("cases/:id/inspection") @UseGuards(JwtAuthGuard)
  inspection(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() body: any) { return this.service.updateInspection(user, id, body); }
  @Post("cases/:id/findings") @UseGuards(JwtAuthGuard)
  finding(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() body: any) { return this.service.addFinding(user, id, body); }
  @Post("cases/:id/actions") @UseGuards(JwtAuthGuard)
  action(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() body: any) { return this.service.addAction(user, id, body); }
  @Post("cases/:id/evidence") @UseGuards(JwtAuthGuard)
  evidence(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() body: any) { return this.service.addEvidence(user, id, body); }
  @Post("cases/:id/actions/:actionId/maintenance") @UseGuards(JwtAuthGuard)
  maintenance(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Param("actionId") actionId: string) { return this.service.createMaintenanceFromAction(user, id, actionId); }
  @Patch("cases/:id/actions/:actionId/verify") @UseGuards(JwtAuthGuard)
  verify(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Param("actionId") actionId: string) { return this.service.verifyAction(user, id, actionId); }
  @Post("cases/:id/close") @UseGuards(JwtAuthGuard)
  close(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) { return this.service.closeCase(user, id); }
}
