import { Body, Controller, Post } from "@nestjs/common";
import { IsEmail, IsIn, IsNotEmpty, Matches } from "class-validator";
import { DemoBookingsService } from "./demo-bookings.service";

const DEMO_ROLES = ["Estate Agent", "Tenant", "Landlord", "Maintenance Provider", "Council Inspector"];

class CreateDemoBookingDto {
  @IsNotEmpty() firstName!: string;
  @IsNotEmpty() lastName!: string;
  @IsEmail({}, { message: "Please enter a valid email address." }) email!: string;
  @IsIn(DEMO_ROLES, { message: "Please select a valid role." }) role!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "Please select a valid demo date." }) demoDate!: string;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "Please select a valid demo time." }) demoTime!: string;
}

@Controller("demo-bookings")
export class DemoBookingsController {
  constructor(private readonly service: DemoBookingsService) {}
  @Post()
  create(@Body() body: CreateDemoBookingDto) { return this.service.create(body); }
}
