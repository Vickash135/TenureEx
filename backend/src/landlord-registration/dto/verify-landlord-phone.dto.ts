import {
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
} from "class-validator";

export class VerifyLandlordPhoneDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, {
    message:
      "code must contain exactly 6 digits",
  })
  code!: string;
}
