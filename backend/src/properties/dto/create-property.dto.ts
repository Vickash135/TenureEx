import { Type } from "class-transformer";
import {
    IsArray,
    IsBoolean,
    IsEmail,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from "class-validator";

export enum PropertyTypeDto {
  HOUSE = "HOUSE",
  FLAT = "FLAT",
  STUDIO = "STUDIO",
  BUNGALOW = "BUNGALOW",
  MAISONETTE = "MAISONETTE",
  OTHER = "OTHER",
}

export enum FurnishingStatusDto {
  FURNISHED = "FURNISHED",
  PART_FURNISHED = "PART_FURNISHED",
  UNFURNISHED = "UNFURNISHED",
}

export enum PropertyStatusDto {
  OCCUPIED = "OCCUPIED",
  VACANT = "VACANT",
  PENDING_APPROVAL = "PENDING_APPROVAL",
}

export enum MaintenanceRouteDto {
  CONTACT_LANDLORD_FIRST = "CONTACT_LANDLORD_FIRST",
  AGENT_CAN_ARRANGE = "AGENT_CAN_ARRANGE",
  USE_PREFERRED_CONTRACTOR = "USE_PREFERRED_CONTRACTOR",
}

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  addressLine1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine2?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  townCity!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  county?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  postcode!: string;

  @IsEnum(PropertyTypeDto)
  propertyType!: PropertyTypeDto;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  bedrooms!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  bathrooms!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  receptionRooms!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monthlyRent!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  depositAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  councilTaxBand?: string;

  @IsEnum(FurnishingStatusDto)
  furnishingStatus!: FurnishingStatusDto;

  @IsEnum(PropertyStatusDto)
  propertyStatus!: PropertyStatusDto;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  tenantName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  tenantEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  tenantPhone?: string;

  @IsOptional()
  @IsString()
  availableFrom?: string;

  @IsBoolean()
  petsAllowed!: boolean;

  @IsBoolean()
  smokingAllowed!: boolean;

  @IsBoolean()
  childrenAllowed!: boolean;

  @IsBoolean()
  hasParking!: boolean;

  @IsBoolean()
  hasGarden!: boolean;

  @IsBoolean()
  hasLift!: boolean;

  @IsBoolean()
  hasWheelchairAccess!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  specialNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  gasSupplier?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  electricitySupplier?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  waterSupplier?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  councilName?: string;

  @IsOptional()
  @IsString()
  gasSafetyExpiry?: string;

  @IsOptional()
  @IsString()
  epcExpiry?: string;

  @IsOptional()
  @IsString()
  eicrExpiry?: string;

  @IsEnum(MaintenanceRouteDto)
  maintenanceRoute!: MaintenanceRouteDto;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  preferredContractor?: string;

  @IsBoolean()
  emergencyRepairPermission!: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  emergencySpendingLimit?: number;

  @IsBoolean()
  advertisingAllowed!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  advertisingTitle?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoNames?: string[];
}
