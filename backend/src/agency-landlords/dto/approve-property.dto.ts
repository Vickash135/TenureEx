import {
    IsEnum,
    IsNumber,
    Max,
    Min,
} from "class-validator";

import { Type } from "class-transformer";

export enum PropertyCommissionType {
  FIXED = "FIXED",
  PERCENTAGE = "PERCENTAGE",
}

export class ApprovePropertyDto {
  @IsEnum(PropertyCommissionType)
  commissionType!: PropertyCommissionType;

  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  @Max(1000000)
  commissionValue!: number;
}