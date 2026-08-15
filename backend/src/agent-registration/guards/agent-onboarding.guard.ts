import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { AgentOnboardingUser } from "../decorators/onboarding-user.decorator";

@Injectable()
export class AgentOnboardingGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AgentOnboardingUser;
    }>();

    const authorization = request.headers.authorization;
    if (!authorization) throw new UnauthorizedException("Registration session token is required.");

    const [type, token] = authorization.split(" ");
    if (type !== "Bearer" || !token) throw new UnauthorizedException("Invalid registration session token.");

    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) throw new Error("JWT_ACCESS_SECRET is missing.");

    try {
      const payload = await this.jwtService.verifyAsync<AgentOnboardingUser>(token, { secret });
      if (payload.purpose !== "AGENT_ONBOARDING" || !payload.sub || !payload.applicationId) {
        throw new UnauthorizedException("Invalid registration session.");
      }
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException("Registration session is invalid or expired.");
    }
  }
}
