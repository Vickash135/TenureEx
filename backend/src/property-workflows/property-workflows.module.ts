import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { MailModule } from "../mail/mail.module";
import { PropertyWorkflowsController } from "./property-workflows.controller";
import { PropertyWorkflowsService } from "./property-workflows.service";

@Module({
  imports: [AuthModule, MailModule],
  controllers: [PropertyWorkflowsController],
  providers: [PropertyWorkflowsService],
  exports: [PropertyWorkflowsService],
})
export class PropertyWorkflowsModule {}
