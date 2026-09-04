import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { MailModule } from "../mail/mail.module";
import { CouncilInspectionsController } from "./council-inspections.controller";
import { CouncilInspectionsService } from "./council-inspections.service";

@Module({ imports: [AuthModule, MailModule], controllers: [CouncilInspectionsController], providers: [CouncilInspectionsService] })
export class CouncilInspectionsModule {}
