import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from "@nestjs/common";

import { UserType } from "../../generated/prisma/enums";

type AdminRequestUser = {
  sub?: string;
  email?: string;
  userType?: string;
};

type RequestWithUser = {
  user?: AdminRequestUser;
};

@Injectable()
export class AdminAuthGuard
  implements CanActivate
{
  canActivate(
    context: ExecutionContext,
  ): boolean {
    const request =
      context
        .switchToHttp()
        .getRequest<RequestWithUser>();

    const user = request.user;

    if (
      !user ||
      user.userType !==
        UserType.TENUREEX_ADMIN
    ) {
      throw new ForbiddenException(
        "Administrator access is required.",
      );
    }

    return true;
  }
}