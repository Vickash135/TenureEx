import {
    IsNotEmpty,
    IsString,
    MaxLength,
} from "class-validator";

export class RejectApplicationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  reason!: string;
}