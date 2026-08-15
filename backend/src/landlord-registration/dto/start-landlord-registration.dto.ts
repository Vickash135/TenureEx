import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class StartLandlordRegistrationDto {
  @IsOptional()
  @IsString()
  invitationToken?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message:
      "dateOfBirth must use YYYY-MM-DD format",
  })
  dateOfBirth!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  residentialAddress!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  postcode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  identificationType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  preferredLanguage!: string;

  @IsBoolean()
  voiceReadingEnabled!: boolean;

  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  digitalSignatureName!: string;

  @IsBoolean()
  agreementAccepted!: boolean;

  @IsBoolean()
  privacyAccepted!: boolean;
}
