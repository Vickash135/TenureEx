import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import type {
    AuthenticatedUser,
} from "../decorators/current-user.decorator";

@Injectable()
export class JwtAuthGuard
  implements CanActivate
{
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{
        headers: {
          authorization?: string;
        };
        user?: AuthenticatedUser;
      }>();

    const authorization =
      request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException(
        "Authentication token is required.",
      );
    }

    const [type, token] =
      authorization.split(" ");

    if (type !== "Bearer" || !token) {
      throw new UnauthorizedException(
        "Invalid authentication token.",
      );
    }

    const secret =
      process.env.JWT_ACCESS_SECRET;

    if (!secret) {
      throw new Error(
        "JWT_ACCESS_SECRET is missing.",
      );
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<AuthenticatedUser>(
          token,
          { secret },
        );

      request.user = payload;

      return true;
    } catch {
      throw new UnauthorizedException(
        "Authentication token is invalid or expired.",
      );
    }
  }
}