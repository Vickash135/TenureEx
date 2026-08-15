import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export type AgentOnboardingUser = {
  sub: string;
  applicationId: string;
  purpose: "AGENT_ONBOARDING";
};

export const OnboardingUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AgentOnboardingUser => {
    const request = context.switchToHttp().getRequest<{ user: AgentOnboardingUser }>();
    return request.user;
  },
);
