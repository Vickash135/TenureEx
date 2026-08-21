import { IsString, IsUUID, Matches } from "class-validator";

export class VerifyTenantEmailDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: "Verification code must contain 6 digits." })
  token!: string;
}
