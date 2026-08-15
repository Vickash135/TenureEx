import {
    IsBoolean,
    IsOptional,
    IsString,
    MaxLength,
} from "class-validator";

export class FinalApproveDto {
  @IsBoolean()
  validationSuccessful!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}