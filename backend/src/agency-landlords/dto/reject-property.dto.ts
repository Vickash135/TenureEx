import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class RejectPropertyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;
}
