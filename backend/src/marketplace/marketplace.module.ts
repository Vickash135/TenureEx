import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MailModule } from "../mail/mail.module";
import { MarketplaceController } from "./marketplace.controller";
import { MarketplaceService } from "./marketplace.service";

@Module({imports: [JwtModule.register({}), MailModule], controllers: [MarketplaceController], providers: [MarketplaceService]})
export class MarketplaceModule {}
