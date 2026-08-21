import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { PrismaService } from "./database/prisma.service";
import { AccessLevel, RoleScope } from "./generated/prisma/enums";

const defaultRoles = [
  {
    key: "AGENCY_ADMINISTRATOR",
    name: "Agency Administrator",
    description: "Full control of the agency workspace.",
    permissionCodes: null,
    accessLevel: AccessLevel.MANAGE,
  },
  {
    key: "BRANCH_MANAGER",
    name: "Branch Manager",
    description: "Manages day-to-day branch operations and staff.",
    permissionCodes: [
      "DASHBOARD_VIEW",
      "PROPERTIES_VIEW",
      "PROPERTIES_CREATE",
      "PROPERTIES_UPDATE",
      "LANDLORDS_VIEW",
      "LANDLORDS_MANAGE",
      "TENANTS_VIEW",
      "TENANTS_MANAGE",
      "APPLICANTS_VIEW",
      "APPLICANTS_MANAGE",
      "MAINTENANCE_VIEW",
      "MAINTENANCE_MANAGE",
      "COMPLIANCE_VIEW",
      "REPORTS_VIEW",
      "USERS_VIEW",
      "MESSAGES_VIEW",
      "MESSAGES_SEND",
      "DOCUMENTS_VIEW",
    ],
    accessLevel: AccessLevel.MANAGE,
  },
  {
    key: "PROPERTY_MANAGER",
    name: "Property Manager",
    description: "Manages properties, tenancies, maintenance and compliance.",
    permissionCodes: [
      "DASHBOARD_VIEW",
      "PROPERTIES_VIEW",
      "PROPERTIES_CREATE",
      "PROPERTIES_UPDATE",
      "PROPERTIES_MANAGE",
      "LANDLORDS_VIEW",
      "TENANTS_VIEW",
      "TENANTS_MANAGE",
      "APPLICANTS_VIEW",
      "APPLICANTS_MANAGE",
      "MAINTENANCE_VIEW",
      "MAINTENANCE_MANAGE",
      "CONTRACTORS_VIEW",
      "CONTRACTORS_MANAGE",
      "COMPLIANCE_VIEW",
      "COMPLIANCE_MANAGE",
      "REPORTS_VIEW",
      "MESSAGES_VIEW",
      "MESSAGES_SEND",
      "DOCUMENTS_VIEW",
      "DOCUMENTS_MANAGE",
    ],
    accessLevel: AccessLevel.MANAGE,
  },
  {
    key: "LETTINGS_AGENT",
    name: "Lettings Agent",
    description: "Handles applicants, lettings and tenant onboarding.",
    permissionCodes: [
      "DASHBOARD_VIEW",
      "PROPERTIES_VIEW",
      "LANDLORDS_VIEW",
      "TENANTS_VIEW",
      "TENANTS_MANAGE",
      "APPLICANTS_VIEW",
      "APPLICANTS_MANAGE",
      "MAINTENANCE_VIEW",
      "COMPLIANCE_VIEW",
      "REPORTS_VIEW",
      "MESSAGES_VIEW",
      "MESSAGES_SEND",
      "DOCUMENTS_VIEW",
    ],
    accessLevel: AccessLevel.MANAGE,
  },
  {
    key: "MAINTENANCE_COORDINATOR",
    name: "Maintenance Coordinator",
    description: "Coordinates maintenance requests and contractors.",
    permissionCodes: [
      "DASHBOARD_VIEW",
      "PROPERTIES_VIEW",
      "LANDLORDS_VIEW",
      "TENANTS_VIEW",
      "MAINTENANCE_VIEW",
      "MAINTENANCE_MANAGE",
      "CONTRACTORS_VIEW",
      "CONTRACTORS_MANAGE",
      "COMPLIANCE_VIEW",
      "REPORTS_VIEW",
      "MESSAGES_VIEW",
      "MESSAGES_SEND",
      "DOCUMENTS_VIEW",
    ],
    accessLevel: AccessLevel.MANAGE,
  },
] as const;

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log"],
  });

  const prisma = app.get(PrismaService);

  try {
    const agencies = await prisma.agency.findMany({
      where: { active: true },
      include: {
        users: {
          where: { isPrimary: true },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });

    if (agencies.length === 0) {
      console.log("No active agencies found.");
      return;
    }

    const allPermissions = await prisma.permission.findMany();

    if (allPermissions.length === 0) {
      throw new Error(
        "No permissions exist. Run: npx ts-node src/seed-permissions.ts first.",
      );
    }

    for (const agency of agencies) {
      const mainBranch = await prisma.agencyBranch.upsert({
        where: {
          agencyId_name: {
            agencyId: agency.id,
            name: "Main Branch",
          },
        },
        update: {
          active: true,
          email: agency.contactEmail,
          phone: agency.contactPhone,
        },
        create: {
          agencyId: agency.id,
          name: "Main Branch",
          email: agency.contactEmail,
          phone: agency.contactPhone,
          active: true,
        },
      });

      const roleIds = new Map<string, string>();

      for (const roleSeed of defaultRoles) {
        const role = await prisma.role.upsert({
          where: {
            code: `${roleSeed.key}_${agency.id}`,
          },
          update: {
            agencyId: agency.id,
            name: roleSeed.name,
            description: roleSeed.description,
            scope: RoleScope.AGENCY,
            enabled: true,
          },
          create: {
            agencyId: agency.id,
            code: `${roleSeed.key}_${agency.id}`,
            name: roleSeed.name,
            description: roleSeed.description,
            scope: RoleScope.AGENCY,
            isSystem: true,
            enabled: true,
          },
        });

        roleIds.set(roleSeed.key, role.id);

        await prisma.rolePermission.deleteMany({
          where: { roleId: role.id },
        });

        const permissions = roleSeed.permissionCodes
          ? allPermissions.filter((permission) =>
              roleSeed.permissionCodes.includes(permission.code as never),
            )
          : allPermissions;

        for (const permission of permissions) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id,
              accessLevel: roleSeed.accessLevel,
            },
          });
        }
      }

      const primaryUser = agency.users[0];
      const adminRoleId = roleIds.get("AGENCY_ADMINISTRATOR");

      if (primaryUser) {
        await prisma.agencyUser.update({
          where: { id: primaryUser.id },
          data: {
            branchId: primaryUser.branchId ?? mainBranch.id,
            jobTitle: primaryUser.jobTitle ?? "Agency Administrator",
          },
        });

        if (adminRoleId) {
          await prisma.agencyUserRole.upsert({
            where: {
              agencyUserId_roleId: {
                agencyUserId: primaryUser.id,
                roleId: adminRoleId,
              },
            },
            update: {},
            create: {
              agencyUserId: primaryUser.id,
              roleId: adminRoleId,
            },
          });
        }
      }

      console.log(
        `Provisioned ${agency.name}: Main Branch + ${defaultRoles.length} roles.`,
      );
    }

    console.log("Agency provisioning completed successfully.");
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error("Agency setup failed:");
  console.error(error);
  process.exit(1);
});
