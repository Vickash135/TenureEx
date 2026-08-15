import { Type } from "class-transformer";
import {
    IsArray,
    IsBoolean,
    IsEmail,
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from "class-validator";

import {
    FurnishingStatusDto,
    MaintenanceRouteDto,
    PropertyStatusDto,
    PropertyTypeDto,
} from "./create-property.dto";

export class UpdatePropertyDto {
  @IsOptional() @IsString() @MaxLength(200) addressLine1?: string;
  @IsOptional() @IsString() @MaxLength(200) addressLine2?: string;
  @IsOptional() @IsString() @MaxLength(120) townCity?: string;
  @IsOptional() @IsString() @MaxLength(120) county?: string;
  @IsOptional() @IsString() @MaxLength(20) postcode?: string;
  @IsOptional() @IsEnum(PropertyTypeDto) propertyType?: PropertyTypeDto;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) bedrooms?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) bathrooms?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) receptionRooms?: number;

  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) monthlyRent?: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) depositAmount?: number;

  @IsOptional() @IsString() @MaxLength(20) councilTaxBand?: string;
  @IsOptional() @IsEnum(FurnishingStatusDto) furnishingStatus?: FurnishingStatusDto;
  @IsOptional() @IsEnum(PropertyStatusDto) propertyStatus?: PropertyStatusDto;

  @IsOptional() @IsString() @MaxLength(200) tenantName?: string;
  @IsOptional() @IsEmail() @MaxLength(200) tenantEmail?: string;
  @IsOptional() @IsString() @MaxLength(40) tenantPhone?: string;
  @IsOptional() @IsString() availableFrom?: string;

  @IsOptional() @IsBoolean() petsAllowed?: boolean;
  @IsOptional() @IsBoolean() smokingAllowed?: boolean;
  @IsOptional() @IsBoolean() childrenAllowed?: boolean;
  @IsOptional() @IsBoolean() hasParking?: boolean;
  @IsOptional() @IsBoolean() hasGarden?: boolean;
  @IsOptional() @IsBoolean() hasLift?: boolean;
  @IsOptional() @IsBoolean() hasWheelchairAccess?: boolean;

  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsString() @MaxLength(5000) specialNotes?: string;
  @IsOptional() @IsString() @MaxLength(150) gasSupplier?: string;
  @IsOptional() @IsString() @MaxLength(150) electricitySupplier?: string;
  @IsOptional() @IsString() @MaxLength(150) waterSupplier?: string;
  @IsOptional() @IsString() @MaxLength(200) councilName?: string;
  @IsOptional() @IsString() gasSafetyExpiry?: string;
  @IsOptional() @IsString() epcExpiry?: string;
  @IsOptional() @IsString() eicrExpiry?: string;

  @IsOptional() @IsEnum(MaintenanceRouteDto) maintenanceRoute?: MaintenanceRouteDto;
  @IsOptional() @IsString() @MaxLength(200) preferredContractor?: string;
  @IsOptional() @IsBoolean() emergencyRepairPermission?: boolean;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) emergencySpendingLimit?: number;
  @IsOptional() @IsBoolean() advertisingAllowed?: boolean;
  @IsOptional() @IsString() @MaxLength(250) advertisingTitle?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) photoNames?: string[];
}
