import { IsString, IsUUID, Matches } from "class-validator";

export class VerifyAgentEmailDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @Matches(/^\d{6}$/, {
    message: "Email verification code must contain exactly 6 digits.",
  })
  token!: string;
}
