import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UseGuards,
} from "@nestjs/common";

import {
    CurrentUser,
    type AuthenticatedUser,
} from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

import { AgencyUsersService } from "./agency-users.service";
import { CreateAgencyUserDto } from "./dto/create-agency-user.dto";
import { UpdateAgencyUserStatusDto } from "./dto/update-agency-user-status.dto";
import { UpdateAgencyUserDto } from "./dto/update-agency-user.dto";

@Controller("agency-users")
@UseGuards(JwtAuthGuard)
export class AgencyUsersController {
  constructor(
    private readonly agencyUsersService: AgencyUsersService,
  ) {}

  @Get()
  getUsers(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.agencyUsersService.getUsers(
      user.sub,
    );
  }

  @Get("branches")
  getBranches(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.agencyUsersService.getBranches(
      user.sub,
    );
  }

  @Get("roles")
  getRoles(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.agencyUsersService.getRoles(
      user.sub,
    );
  }

  @Get(":id")
  getUser(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("id", ParseUUIDPipe)
    id: string,
  ) {
    return this.agencyUsersService.getUser(
      user.sub,
      id,
    );
  }

  @Post()
  createUser(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: CreateAgencyUserDto,
  ) {
    return this.agencyUsersService.createUser(
      user.sub,
      dto,
    );
  }

  @Patch(":id")
  updateUser(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("id", ParseUUIDPipe)
    id: string,

    @Body()
    dto: UpdateAgencyUserDto,
  ) {
    return this.agencyUsersService.updateUser(
      user.sub,
      id,
      dto,
    );
  }

  @Patch(":id/status")
  updateStatus(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("id", ParseUUIDPipe)
    id: string,

    @Body()
    dto: UpdateAgencyUserStatusDto,
  ) {
    return this.agencyUsersService.updateStatus(
      user.sub,
      id,
      dto.status,
    );
  }
}