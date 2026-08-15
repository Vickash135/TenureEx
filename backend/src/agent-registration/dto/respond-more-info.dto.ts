import {
    IsNotEmpty,
    IsString,
    MaxLength,
} from "class-validator";

export class RespondMoreInfoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  response!: string;
}