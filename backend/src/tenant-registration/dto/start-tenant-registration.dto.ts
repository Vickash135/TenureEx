import { IsEmail, MaxLength } from "class-validator";

export class StartTenantRegistrationDto {
  @IsEmail()
  @MaxLength(200)
  email!: string;
}
