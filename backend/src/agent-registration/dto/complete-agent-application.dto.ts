import { IsBoolean, IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from "class-validator";

export class CompleteAgentApplicationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  businessDetails!: string;

  @IsInt()
  @Min(1)
  @Max(100000)
  employeeCount!: number;

  @IsInt()
  @Min(1)
  @Max(100000)
  requiredLoginCount!: number;

  @IsInt()
  @Min(0)
  @Max(10000000)
  propertyCount!: number;

  @IsInt()
  @Min(1)
  @Max(100000)
  branchCount!: number;

  @IsBoolean()
  authorisedDeclaration!: boolean;

  @IsBoolean()
  termsAccepted!: boolean;

  @IsBoolean()
  privacyAccepted!: boolean;
}
