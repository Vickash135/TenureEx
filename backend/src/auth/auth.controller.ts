import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from "@nestjs/common";

import { AuthService } from "./auth.service";
import {
  CurrentUser,
  type AuthenticatedUser,
} from "./decorators/current-user.decorator";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  // =========================================================
  // NORMAL LOGIN
  // Landlord / Estate Agent / other users
  // =========================================================

  @Post("login")
  login(
    @Body() dto: LoginDto,
  ) {
    return this.authService.login(dto);
  }

  // =========================================================
  // ADMIN LOGIN
  // TENUREEX_ADMIN only
  // =========================================================

  @Post("admin/login")
  adminLogin(
    @Body() dto: LoginDto,
  ) {
    return this.authService.adminLogin(
      dto,
    );
  }

  // =========================================================
  // REFRESH TOKEN
  // =========================================================

  @Post("refresh")
  refresh(
    @Body() dto: RefreshTokenDto,
  ) {
    return this.authService.refresh(
      dto.refreshToken,
    );
  }

  // =========================================================
  // FORGOT PASSWORD
  // =========================================================

  @Post("forgot-password")
  forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(
      dto.email,
    );
  }

  // =========================================================
  // RESET PASSWORD
  // =========================================================

  @Post("reset-password")
  resetPassword(
    @Body() dto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(
      dto.token,
      dto.newPassword,
    );
  }

  // =========================================================
  // CURRENT USER
  // =========================================================

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.authService.getCurrentUser(
      user.sub,
    );
  }
}