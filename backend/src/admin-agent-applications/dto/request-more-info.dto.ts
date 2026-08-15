import {
    IsNotEmpty,
    IsString,
    MaxLength,
} from "class-validator";

export class RequestMoreInfoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  message!: string;
}