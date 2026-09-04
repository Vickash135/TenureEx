import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import {
  CurrentUser,
  type AuthenticatedUser,
} from "../auth/decorators/current-user.decorator";

import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

import { CouncilInspectionsService } from "./council-inspections.service";

@Controller("council-inspections")
export class CouncilInspectionsController {
  constructor(private readonly service: CouncilInspectionsService) {}

  // =========================================================
  // ADMIN - COUNCIL INSPECTOR MANAGEMENT
  // =========================================================

  @Post("admin/invitations")
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  invite(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.service.inviteInspector(user.sub, body);
  }

  @Get("admin/invitations")
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  invitations() {
    return this.service.listInvitations();
  }

  @Get("admin/inspectors")
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  adminInspectors() {
    return this.service.listInspectors();
  }

  @Patch("admin/inspectors/:id/status")
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  inspectorStatus(
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.service.updateInspectorStatus(id, body.status);
  }

  // =========================================================
  // PUBLIC INVITATION ROUTES
  // =========================================================

  @Get("invitation/:token")
  invitation(@Param("token") token: string) {
    return this.service.getInvitation(token);
  }

  @Post("invitation/:token/accept")
  accept(
    @Param("token") token: string,
    @Body() body: any,
  ) {
    return this.service.acceptInvitation(token, body);
  }

  // =========================================================
  // COUNCIL INSPECTOR DIRECTORY
  // =========================================================

  @Get("directory")
  @UseGuards(JwtAuthGuard)
  directory(@CurrentUser() user: AuthenticatedUser) {
    return this.service.directory(user);
  }

  // =========================================================
  // ACCESSIBLE PROPERTIES
  // =========================================================

  @Get("properties")
  @UseGuards(JwtAuthGuard)
  properties(@CurrentUser() user: AuthenticatedUser) {
    return this.service.accessibleProperties(user);
  }

  // =========================================================
  // INSPECTION CASES
  // =========================================================

  @Post("cases")
  @UseGuards(JwtAuthGuard)
  createCase(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.service.createCase(user, body);
  }

  @Get("cases")
  @UseGuards(JwtAuthGuard)
  cases(
    @CurrentUser() user: AuthenticatedUser,
    @Query("status") status?: string,
  ) {
    return this.service.listCases(user, status);
  }

  @Get("cases/:id")
  @UseGuards(JwtAuthGuard)
  caseDetails(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.service.getCase(user, id);
  }

  // =========================================================
  // INSPECTOR CASE ACTIONS
  // =========================================================

  @Post("cases/:id/accept")
  @UseGuards(JwtAuthGuard)
  acceptCase(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.service.acceptCase(user, id);
  }

  @Post("cases/:id/decline")
  @UseGuards(JwtAuthGuard)
  declineCase(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.service.declineCase(user, id, body.reason);
  }

  @Patch("cases/:id/schedule")
  @UseGuards(JwtAuthGuard)
  schedule(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.service.scheduleCase(user, id, body);
  }

  @Patch("cases/:id/inspection")
  @UseGuards(JwtAuthGuard)
  inspection(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.service.updateInspection(user, id, body);
  }

  // =========================================================
  // FINDINGS
  // =========================================================

  @Post("cases/:id/findings")
  @UseGuards(JwtAuthGuard)
  finding(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.service.addFinding(user, id, body);
  }

  // =========================================================
  // REQUIRED ACTIONS
  // =========================================================

  @Post("cases/:id/actions")
  @UseGuards(JwtAuthGuard)
  action(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.service.addAction(user, id, body);
  }

  // =========================================================
  // EVIDENCE
  // =========================================================

  @Post("cases/:id/evidence")
  @UseGuards(JwtAuthGuard)
  evidence(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.service.addEvidence(user, id, body);
  }

  // =========================================================
  // CREATE MAINTENANCE REQUEST FROM COUNCIL ACTION
  // =========================================================

  @Post("cases/:id/actions/:actionId/maintenance")
  @UseGuards(JwtAuthGuard)
  maintenance(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Param("actionId") actionId: string,
  ) {
    return this.service.createMaintenanceFromAction(
      user,
      id,
      actionId,
    );
  }

  // =========================================================
  // VERIFY REQUIRED ACTION
  // =========================================================

  @Patch("cases/:id/actions/:actionId/verify")
  @UseGuards(JwtAuthGuard)
  verify(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Param("actionId") actionId: string,
  ) {
    return this.service.verifyAction(user, id, actionId);
  }

  // =========================================================
  // CLOSE INSPECTION CASE
  // =========================================================

  @Post("cases/:id/close")
  @UseGuards(JwtAuthGuard)
  close(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.service.closeCase(user, id);
  }
}