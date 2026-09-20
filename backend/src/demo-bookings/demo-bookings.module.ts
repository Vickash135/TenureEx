import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { MailModule } from "../mail/mail.module";
import { DemoBookingsController } from "./demo-bookings.controller";
import { DemoBookingsService } from "./demo-bookings.service";

@Module({ imports: [DatabaseModule, MailModule], controllers: [DemoBookingsController], providers: [DemoBookingsService] })
export class DemoBookingsModule {}
