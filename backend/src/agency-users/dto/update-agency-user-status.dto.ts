import { IsEnum } from "class-validator";
import { UserStatus } from "../../generated/prisma/enums";

export class UpdateAgencyUserStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;
}