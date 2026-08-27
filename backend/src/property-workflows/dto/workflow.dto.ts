import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested
} from "class-validator";

export class CreateTenantInquiryDto {
  @IsUUID() propertyId!: string;
  @IsString() @MinLength(1) firstName!: string;
  @IsString() @MinLength(1) lastName!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() message?: string;
}

export class InviteTenantDto {
  @IsUUID() propertyId!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
}

export class CompleteTenantInvitationDto {
  @IsString() token!: string;
  @IsString() @MinLength(1) firstName!: string;
  @IsString() @MinLength(1) lastName!: string;
  @IsString() @MinLength(8) password!: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsString() currentAddress?: string;
  @IsOptional() @IsString() postcode?: string;
  @IsOptional() @IsString() identificationType?: string;
  @IsOptional() @IsString() identificationFileUrl?: string;
  @IsOptional() @IsString() emergencyContactName?: string;
  @IsOptional() @IsString() emergencyContactPhone?: string;
  @IsOptional() @IsString() additionalNotes?: string;
  @IsString() @MinLength(2) signatureName!: string;
  @IsBoolean() acceptedAgreement!: boolean;
}

export class ReviewTenantApplicationDto {
  @IsIn(["APPROVE", "REJECT", "REQUEST_MORE_INFORMATION"])
  action!: "APPROVE" | "REJECT" | "REQUEST_MORE_INFORMATION";
  @IsOptional() @IsString() message?: string;
}

export class ResubmitTenantApplicationDto {
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsString() currentAddress?: string;
  @IsOptional() @IsString() postcode?: string;
  @IsOptional() @IsString() identificationType?: string;
  @IsOptional() @IsString() identificationFileUrl?: string;
  @IsOptional() @IsString() emergencyContactName?: string;
  @IsOptional() @IsString() emergencyContactPhone?: string;
  @IsOptional() @IsString() additionalNotes?: string;
  @IsString() @MinLength(2) responseNote!: string;
}

export class InviteMaintenanceDto {
  @IsUUID() propertyId!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() tradeType?: string;
  @IsOptional() @IsIn(["ESTATE_AGENT", "LANDLORD", "TENANT"]) actingRole?: "ESTATE_AGENT" | "LANDLORD" | "TENANT";
}

export class CompleteMaintenanceInvitationDto {
  @IsString() token!: string;
  @IsString() @MinLength(1) firstName!: string;
  @IsString() @MinLength(1) lastName!: string;
  @IsString() @MinLength(8) password!: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() businessName?: string;
  @IsOptional() @IsString() tradeType?: string;
  @IsOptional() @IsString() registrationNumber?: string;
  @IsOptional() @IsDateString() insuranceExpiry?: string;
}

export class ReviewMaintenanceProviderDto {
  @IsIn(["APPROVE", "REJECT"])
  action!: "APPROVE" | "REJECT";
  @IsOptional() @IsString() message?: string;
}

export class MaintenanceSlotDto {
  @IsDateString() startAt!: string;
  @IsDateString() endAt!: string;
}

export class CreateMaintenanceRequestDto {
  @IsUUID() propertyId!: string;
  @IsString() @MinLength(3) title!: string;
  @IsString() @MinLength(5) description!: string;
  @IsString() category!: string;
  @IsOptional() @IsString() roomLocation?: string;
  @IsOptional() @IsIn(["LOW", "MEDIUM", "HIGH", "EMERGENCY"]) priority?: string;
  @IsOptional() @IsBoolean() accessPermission?: boolean;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => MaintenanceSlotDto)
  slots!: MaintenanceSlotDto[];
}

export class AcceptMaintenanceSlotDto {
  @IsUUID() slotId!: string;
}

export class UpdateMaintenanceStatusDto {
  @IsOptional() @IsString() providerNotes?: string;
  @IsOptional() @IsString() completionNotes?: string;
}

export class ConfirmMaintenanceDto {
  @IsBoolean() completed!: boolean;
  @IsOptional() @IsString() note?: string;
}
