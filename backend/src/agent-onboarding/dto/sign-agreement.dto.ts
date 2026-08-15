import {
    IsNotEmpty,
    IsString,
    MaxLength,
} from "class-validator";

export class SignAgreementDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  signatureName!: string;
}