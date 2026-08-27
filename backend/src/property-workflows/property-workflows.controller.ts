import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { randomUUID } from "crypto";
import { existsSync, mkdirSync } from "fs";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { CurrentUser, type AuthenticatedUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  AcceptMaintenanceSlotDto,
  CompleteMaintenanceInvitationDto,
  CompleteTenantInvitationDto,
  ConfirmMaintenanceDto,
  CreateMaintenanceRequestDto,
  CreateTenantInquiryDto,
  InviteMaintenanceDto,
  InviteTenantDto,
  ResubmitTenantApplicationDto,
  ReviewMaintenanceProviderDto,
  ReviewTenantApplicationDto,
  UpdateMaintenanceStatusDto,
} from "./dto/workflow.dto";
import { PropertyWorkflowsService } from "./property-workflows.service";

const maintenanceUploadDirectory = join(process.cwd(), "uploads", "maintenance");
if (!existsSync(maintenanceUploadDirectory)) mkdirSync(maintenanceUploadDirectory, { recursive: true });

const tenantIdentificationUploadDirectory = join(process.cwd(), "uploads", "tenants", "identification");
if (!existsSync(tenantIdentificationUploadDirectory)) mkdirSync(tenantIdentificationUploadDirectory, { recursive: true });

const tenantIdentificationUpload = FileInterceptor("identificationFile", {
  storage: diskStorage({
    destination: (_req, _file, cb) => cb(null, tenantIdentificationUploadDirectory),
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!["application/pdf", "image/jpeg", "image/png"].includes(file.mimetype)) {
      return cb(new BadRequestException("Identification document must be a PDF, JPG, JPEG or PNG file."), false);
    }
    cb(null, true);
  },
});

const maintenanceUpload = FilesInterceptor("photos", 10, {
  storage: diskStorage({
    destination: (_req, _file, cb) => cb(null, maintenanceUploadDirectory),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.mimetype)) {
      return cb(new BadRequestException("Only JPG, JPEG, PNG and WEBP photos are allowed."), false);
    }
    cb(null, true);
  },
});

@Controller("property-workflows")
export class PropertyWorkflowsController {
  constructor(private readonly service: PropertyWorkflowsService) {}

  @Post("tenant-inquiries") createInquiry(@Body() dto: CreateTenantInquiryDto) { return this.service.createTenantInquiry(dto); }
  @Get("tenant-invitations/:token") inspectTenantInvitation(@Param("token") token: string) { return this.service.inspectTenantInvitation(token); }

  @Post("tenant-invitations/:token/identification")
  @UseInterceptors(tenantIdentificationUpload)
  async uploadTenantInvitationIdentification(@Param("token") token: string, @UploadedFile() file?: Express.Multer.File) {
    await this.service.inspectTenantInvitation(token);
    if (!file) throw new BadRequestException("Please select an identification document to upload.");
    return { identificationFileUrl: `/api/v1/uploads/tenants/identification/${file.filename}`, fileName: file.originalname };
  }

  @Post("tenant-invitations/complete") completeTenantInvitation(@Body() dto: CompleteTenantInvitationDto) { return this.service.completeTenantInvitation(dto); }

  @Get("tenant-application-update/:token")
  inspectTenantApplicationUpdate(@Param("token") token: string) { return this.service.inspectTenantApplicationUpdate(token); }

  @Post("tenant-application-update/:token/identification")
  @UseInterceptors(tenantIdentificationUpload)
  async uploadTenantApplicationUpdateIdentification(@Param("token") token: string, @UploadedFile() file?: Express.Multer.File) {
    await this.service.inspectTenantApplicationUpdate(token);
    if (!file) throw new BadRequestException("Please select an identification document to upload.");
    return { identificationFileUrl: `/api/v1/uploads/tenants/identification/${file.filename}`, fileName: file.originalname };
  }

  @Patch("tenant-application-update/:token")
  resubmitTenantApplication(@Param("token") token: string, @Body() dto: ResubmitTenantApplicationDto) { return this.service.resubmitTenantApplication(token, dto); }
  @Get("maintenance-invitations/:token") inspectMaintenanceInvitation(@Param("token") token: string) { return this.service.inspectMaintenanceInvitation(token); }
  @Post("maintenance-invitations/complete") completeMaintenanceInvitation(@Body() dto: CompleteMaintenanceInvitationDto) { return this.service.completeMaintenanceInvitation(dto); }

  @Post("tenant-invitations") @UseGuards(JwtAuthGuard)
  inviteTenant(@CurrentUser() user: AuthenticatedUser, @Body() dto: InviteTenantDto) { return this.service.inviteTenant(user.sub, dto); }

  @Get("tenant-inquiries") @UseGuards(JwtAuthGuard)
  tenantInquiries(@CurrentUser() user: AuthenticatedUser) { return this.service.listTenantInquiriesForAgent(user.sub); }

  @Get("tenant-applications") @UseGuards(JwtAuthGuard)
  tenantApplications(@CurrentUser() user: AuthenticatedUser) { return this.service.listTenantApplicationsForAgent(user.sub); }

  @Get("tenant-applications/:id") @UseGuards(JwtAuthGuard)
  tenantApplication(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) { return this.service.getTenantApplicationForAgent(user.sub, id); }

  @Patch("tenant-applications/:id/review") @UseGuards(JwtAuthGuard)
  reviewTenant(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string, @Body() dto: ReviewTenantApplicationDto) { return this.service.reviewTenantApplication(user.sub, id, dto); }

  @Get("tenant/my-properties") @UseGuards(JwtAuthGuard)
  tenantProperties(@CurrentUser() user: AuthenticatedUser) { return this.service.listTenantProperties(user.sub); }

  @Post("maintenance-invitations") @UseGuards(JwtAuthGuard)
  inviteMaintenance(@CurrentUser() user: AuthenticatedUser, @Body() dto: InviteMaintenanceDto) { return this.service.inviteMaintenance(user.sub, dto); }

  @Get("maintenance/my-properties") @UseGuards(JwtAuthGuard)
  maintenanceProperties(@CurrentUser() user: AuthenticatedUser) { return this.service.listMaintenanceProperties(user.sub); }

  @Get("properties/:propertyId/maintenance-providers") @UseGuards(JwtAuthGuard)
  propertyMaintenance(@CurrentUser() user: AuthenticatedUser, @Param("propertyId", ParseUUIDPipe) propertyId: string) { return this.service.listPropertyMaintenanceProviders(user.sub, propertyId); }

  @Patch("maintenance-providers/:id/review") @UseGuards(JwtAuthGuard)
  reviewMaintenance(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string, @Body() dto: ReviewMaintenanceProviderDto) { return this.service.reviewMaintenanceProvider(user.sub, id, dto); }

  @Post("maintenance-requests") @UseGuards(JwtAuthGuard)
  createMaintenance(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMaintenanceRequestDto) { return this.service.createMaintenanceRequest(user.sub, dto); }

  @Post("maintenance-requests/:id/reported-photos") @UseGuards(JwtAuthGuard) @UseInterceptors(maintenanceUpload)
  reportedPhotos(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string, @UploadedFiles() files: Express.Multer.File[]) { return this.service.addMaintenancePhotos(user.sub, id, "REPORTED", files || []); }

  @Get("maintenance-requests") @UseGuards(JwtAuthGuard)
  maintenanceRequests(@CurrentUser() user: AuthenticatedUser) { return this.service.listMaintenanceRequests(user.sub); }

  @Get("maintenance-requests/:id") @UseGuards(JwtAuthGuard)
  maintenanceRequest(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) { return this.service.getMaintenanceRequest(user.sub, id); }

  @Post("maintenance-requests/:id/accept-slot") @UseGuards(JwtAuthGuard)
  acceptSlot(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string, @Body() dto: AcceptMaintenanceSlotDto) { return this.service.acceptMaintenanceSlot(user.sub, id, dto.slotId); }

  @Patch("maintenance-requests/:id/start") @UseGuards(JwtAuthGuard)
  startJob(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateMaintenanceStatusDto) { return this.service.startMaintenanceJob(user.sub, id, dto); }

  @Post("maintenance-requests/:id/before-photos") @UseGuards(JwtAuthGuard) @UseInterceptors(maintenanceUpload)
  beforePhotos(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string, @UploadedFiles() files: Express.Multer.File[]) { return this.service.addMaintenancePhotos(user.sub, id, "BEFORE", files || []); }

  @Post("maintenance-requests/:id/after-photos") @UseGuards(JwtAuthGuard) @UseInterceptors(maintenanceUpload)
  afterPhotos(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string, @UploadedFiles() files: Express.Multer.File[]) { return this.service.addMaintenancePhotos(user.sub, id, "AFTER", files || []); }

  @Patch("maintenance-requests/:id/finish") @UseGuards(JwtAuthGuard)
  finishJob(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateMaintenanceStatusDto) { return this.service.finishMaintenanceJob(user.sub, id, dto); }

  @Patch("maintenance-requests/:id/tenant-confirm") @UseGuards(JwtAuthGuard)
  confirmJob(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string, @Body() dto: ConfirmMaintenanceDto) { return this.service.confirmMaintenanceCompletion(user.sub, id, dto); }

  @Get("notifications") @UseGuards(JwtAuthGuard)
  notifications(@CurrentUser() user: AuthenticatedUser) { return this.service.listNotifications(user.sub); }

  @Patch("notifications/:id/read") @UseGuards(JwtAuthGuard)
  readNotification(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) { return this.service.markNotificationRead(user.sub, id); }
}
