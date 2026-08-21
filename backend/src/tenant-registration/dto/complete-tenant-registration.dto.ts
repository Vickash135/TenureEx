import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CompleteTenantRegistrationDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postcode?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  mainReason!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  idealTimeframe!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  currentLivingSituation!: string;
}
