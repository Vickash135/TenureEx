import {
    IsOptional,
    IsString,
    MaxLength,
} from "class-validator";

export class ReviewApplicationDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}