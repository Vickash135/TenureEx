import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CouncilInspectionsModule } from "./council-inspections/council-inspections.module";

import { AddressLookupModule } from "./address-lookup/address-lookup.module";
import { AdminAgentApplicationsModule } from "./admin-agent-applications/admin-agent-applications.module";
import { AgencyLandlordsModule } from "./agency-landlords/agency-landlords.module";
import { AgencyUsersModule } from "./agency-users/agency-users.module";
import { AgentOnboardingModule } from "./agent-onboarding/agent-onboarding.module";
import { AgentRegistrationModule } from "./agent-registration/agent-registration.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { LandlordRegistrationModule } from "./landlord-registration/landlord-registration.module";
import { PropertiesModule } from "./properties/properties.module";
import { PropertyWorkflowsModule } from "./property-workflows/property-workflows.module";
import { TenantRegistrationModule } from "./tenant-registration/tenant-registration.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    DatabaseModule,
    UsersModule,
    AuthModule,
    AgentRegistrationModule,
    AdminAgentApplicationsModule,
    AgentOnboardingModule,
    AgencyUsersModule,
    AgencyLandlordsModule,
    LandlordRegistrationModule,
    AddressLookupModule,
    PropertiesModule,
    TenantRegistrationModule,
    PropertyWorkflowsModule,
    CouncilInspectionsModule,
  ],

  controllers: [
    AppController,
  ],

  providers: [
    AppService,
  ],
})
export class AppModule {}