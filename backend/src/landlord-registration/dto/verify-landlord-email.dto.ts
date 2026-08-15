import {
  IsNotEmpty,
  IsString,
  IsUUID,
} from "class-validator";

export class VerifyLandlordEmailDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  token!: string;
}
