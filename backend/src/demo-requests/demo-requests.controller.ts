import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { IsEmail } from "class-validator";

import {
  CurrentUser,
  type AuthenticatedUser,
} from "../auth/decorators/current-user.decorator";
import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { DemoRequestsService } from "./demo-requests.service";

class CreateDemoRequestDto {
  @IsEmail({}, { message: "Please enter a valid email address." })
  email!: string;
}

@Controller("demo-requests")
export class DemoRequestsController {
  constructor(private readonly service: DemoRequestsService) {}

  @Post()
  create(@Body() body: CreateDemoRequestDto) {
    return this.service.create(body.email);
  }

  @Get("admin")
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  list() {
    return this.service.list();
  }

  @Patch("admin/:id/approve")
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.service.approve(id, user.sub);
  }

  @Patch("admin/:id/reject")
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.service.reject(id, user.sub);
  }
}
