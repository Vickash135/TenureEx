import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from "class-validator";

import { RegistrationType } from "../../generated/prisma/enums";

export class StartAgentRegistrationDto {
  @IsEnum(RegistrationType)
  registrationType!: RegistrationType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @IsEmail()
  contactEmail!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+44\d{10}$/, {
    message:
      "contactPhone must be a valid UK phone number in +44 format",
  })
  contactPhone!: string;

  @ValidateIf(
    (dto: StartAgentRegistrationDto) =>
      dto.registrationType === RegistrationType.BUSINESS,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  businessName?: string;

  @ValidateIf(
    (dto: StartAgentRegistrationDto) =>
      dto.registrationType === RegistrationType.BUSINESS,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  companyNumber?: string;
}