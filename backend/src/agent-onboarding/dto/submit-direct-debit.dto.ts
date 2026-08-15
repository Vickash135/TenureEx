import {
    IsNotEmpty,
    IsString,
    MaxLength,
} from "class-validator";

export class SubmitDirectDebitDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  providerCustomerReference!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  providerMandateReference!: string;
}