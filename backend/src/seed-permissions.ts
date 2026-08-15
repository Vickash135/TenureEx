import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { PrismaService } from "./database/prisma.service";
import {
  AccessLevel,
  RoleScope,
} from "./generated/prisma/enums";

type PermissionSeed = {
  code: string;
  module: string;
  description: string;
};

const permissions: PermissionSeed[] = [
  {
    code: "DASHBOARD_VIEW",
    module: "DASHBOARD",
    description: "View agency dashboard.",
  },

  {
    code: "USERS_VIEW",
    module: "USERS",
    description: "View agency users.",
  },
  {
    code: "USERS_CREATE",
    module: "USERS",
    description: "Create and invite agency users.",
  },
  {
    code: "USERS_UPDATE",
    module: "USERS",
    description: "Update agency users.",
  },
  {
    code: "USERS_MANAGE",
    module: "USERS",
    description:
      "Manage agency users and their status.",
  },

  {
    code: "ROLES_VIEW",
    module: "ROLES_PERMISSIONS",
    description: "View roles and permissions.",
  },
  {
    code: "ROLES_MANAGE",
    module: "ROLES_PERMISSIONS",
    description:
      "Create, update and manage roles and permissions.",
  },

  {
    code: "PROPERTIES_VIEW",
    module: "PROPERTIES",
    description: "View properties.",
  },
  {
    code: "PROPERTIES_CREATE",
    module: "PROPERTIES",
    description: "Create properties.",
  },
  {
    code: "PROPERTIES_UPDATE",
    module: "PROPERTIES",
    description: "Update properties.",
  },
  {
    code: "PROPERTIES_MANAGE",
    module: "PROPERTIES",
    description: "Fully manage properties.",
  },

  {
    code: "LANDLORDS_VIEW",
    module: "LANDLORDS",
    description: "View landlords.",
  },
  {
    code: "LANDLORDS_MANAGE",
    module: "LANDLORDS",
    description: "Manage landlords.",
  },

  {
    code: "TENANTS_VIEW",
    module: "TENANTS",
    description: "View tenants.",
  },
  {
    code: "TENANTS_MANAGE",
    module: "TENANTS",
    description: "Manage tenants.",
  },

  {
    code: "APPLICANTS_VIEW",
    module: "APPLICANTS",
    description: "View applicants.",
  },
  {
    code: "APPLICANTS_MANAGE",
    module: "APPLICANTS",
    description:
      "Manage applicants and applications.",
  },

  {
    code: "MAINTENANCE_VIEW",
    module: "MAINTENANCE",
    description: "View maintenance requests.",
  },
  {
    code: "MAINTENANCE_MANAGE",
    module: "MAINTENANCE",
    description: "Manage maintenance requests.",
  },

  {
    code: "CONTRACTORS_VIEW",
    module: "CONTRACTORS",
    description: "View contractors.",
  },
  {
    code: "CONTRACTORS_MANAGE",
    module: "CONTRACTORS",
    description: "Manage contractors.",
  },

  {
    code: "COMPLIANCE_VIEW",
    module: "COMPLIANCE",
    description: "View compliance information.",
  },
  {
    code: "COMPLIANCE_MANAGE",
    module: "COMPLIANCE",
    description: "Manage compliance information.",
  },

  {
    code: "REPORTS_VIEW",
    module: "REPORTS",
    description: "View agency reports.",
  },
  {
    code: "REPORTS_MANAGE",
    module: "REPORTS",
    description: "Create and manage agency reports.",
  },

  {
    code: "MESSAGES_VIEW",
    module: "MESSAGES",
    description: "View messages.",
  },
  {
    code: "MESSAGES_SEND",
    module: "MESSAGES",
    description: "Send messages.",
  },

  {
    code: "SETTINGS_VIEW",
    module: "SETTINGS",
    description: "View agency settings.",
  },
  {
    code: "SETTINGS_MANAGE",
    module: "SETTINGS",
    description: "Manage agency settings.",
  },

  {
    code: "PAYMENTS_VIEW",
    module: "PAYMENTS",
    description: "View payment information.",
  },
  {
    code: "PAYMENTS_MANAGE",
    module: "PAYMENTS",
    description: "Manage payment information.",
  },

  {
    code: "DOCUMENTS_VIEW",
    module: "DOCUMENTS",
    description: "View documents.",
  },
  {
    code: "DOCUMENTS_MANAGE",
    module: "DOCUMENTS",
    description: "Manage documents.",
  },
];

async function main() {
  const app =
    await NestFactory.createApplicationContext(
      AppModule,
      {
        logger: false,
      },
    );

  try {
    const prisma =
      app.get(PrismaService);

    console.log(
      "Starting TenureEx permission seed...",
    );

    // =========================================================
    // CREATE PERMISSIONS
    // =========================================================

    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: {
          code: permission.code,
        },

        update: {
          module: permission.module,
          description:
            permission.description,
        },

        create: {
          code: permission.code,
          module: permission.module,
          description:
            permission.description,
        },
      });
    }

    console.log(
      `${permissions.length} permissions created/updated.`,
    );

    const allPermissions =
      await prisma.permission.findMany();

    // =========================================================
    // AGENCY ADMINISTRATOR
    // Full MANAGE access
    // =========================================================

    const administratorRoles =
      await prisma.role.findMany({
        where: {
          name:
            "Agency Administrator",

          scope:
            RoleScope.AGENCY,

          enabled: true,
        },
      });

    for (
      const role of
      administratorRoles
    ) {
      for (
        const permission of
        allPermissions
      ) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId:
                permission.id,
            },
          },

          update: {
            accessLevel:
              AccessLevel.MANAGE,
          },

          create: {
            roleId: role.id,
            permissionId:
              permission.id,

            accessLevel:
              AccessLevel.MANAGE,
          },
        });
      }
    }

    console.log(
      `Agency Administrator roles updated: ${administratorRoles.length}`,
    );

    // =========================================================
    // AGENCY STAFF
    // =========================================================

    const staffPermissionCodes = [
      "DASHBOARD_VIEW",
      "PROPERTIES_VIEW",
      "LANDLORDS_VIEW",
      "TENANTS_VIEW",
      "APPLICANTS_VIEW",
      "MAINTENANCE_VIEW",
      "CONTRACTORS_VIEW",
      "COMPLIANCE_VIEW",
      "REPORTS_VIEW",
      "MESSAGES_VIEW",
      "MESSAGES_SEND",
      "DOCUMENTS_VIEW",
    ];

    const staffRoles =
      await prisma.role.findMany({
        where: {
          name:
            "Agency Staff",

          scope:
            RoleScope.AGENCY,

          enabled: true,
        },
      });

    const staffPermissions =
      await prisma.permission.findMany({
        where: {
          code: {
            in:
              staffPermissionCodes,
          },
        },
      });

    for (
      const role of staffRoles
    ) {
      for (
        const permission of
        staffPermissions
      ) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId:
                permission.id,
            },
          },

          update: {
            accessLevel:
              AccessLevel.READ,
          },

          create: {
            roleId: role.id,
            permissionId:
              permission.id,

            accessLevel:
              AccessLevel.READ,
          },
        });
      }
    }

    console.log(
      `Agency Staff roles updated: ${staffRoles.length}`,
    );

    // =========================================================
    // PROPERTY MANAGER
    // =========================================================

    const propertyManagerCodes = [
      "DASHBOARD_VIEW",
      "PROPERTIES_VIEW",
      "PROPERTIES_CREATE",
      "PROPERTIES_UPDATE",
      "PROPERTIES_MANAGE",
      "LANDLORDS_VIEW",
      "LANDLORDS_MANAGE",
      "TENANTS_VIEW",
      "TENANTS_MANAGE",
      "MAINTENANCE_VIEW",
      "MAINTENANCE_MANAGE",
      "CONTRACTORS_VIEW",
      "CONTRACTORS_MANAGE",
      "COMPLIANCE_VIEW",
      "DOCUMENTS_VIEW",
      "DOCUMENTS_MANAGE",
      "MESSAGES_VIEW",
      "MESSAGES_SEND",
      "REPORTS_VIEW",
    ];

    const propertyManagerRoles =
      await prisma.role.findMany({
        where: {
          name:
            "Property Manager",

          scope:
            RoleScope.AGENCY,

          enabled: true,
        },
      });

    const propertyManagerPermissions =
      await prisma.permission.findMany({
        where: {
          code: {
            in:
              propertyManagerCodes,
          },
        },
      });

    for (
      const role of
      propertyManagerRoles
    ) {
      for (
        const permission of
        propertyManagerPermissions
      ) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId:
                permission.id,
            },
          },

          update: {
            accessLevel:
              AccessLevel.MANAGE,
          },

          create: {
            roleId: role.id,
            permissionId:
              permission.id,

            accessLevel:
              AccessLevel.MANAGE,
          },
        });
      }
    }

    console.log(
      `Property Manager roles updated: ${propertyManagerRoles.length}`,
    );

    // =========================================================
    // LETTINGS MANAGER
    // =========================================================

    const lettingsManagerCodes = [
      "DASHBOARD_VIEW",
      "PROPERTIES_VIEW",
      "LANDLORDS_VIEW",
      "LANDLORDS_MANAGE",
      "TENANTS_VIEW",
      "TENANTS_MANAGE",
      "APPLICANTS_VIEW",
      "APPLICANTS_MANAGE",
      "DOCUMENTS_VIEW",
      "DOCUMENTS_MANAGE",
      "MESSAGES_VIEW",
      "MESSAGES_SEND",
      "REPORTS_VIEW",
      "COMPLIANCE_VIEW",
    ];

    const lettingsManagerRoles =
      await prisma.role.findMany({
        where: {
          name:
            "Lettings Manager",

          scope:
            RoleScope.AGENCY,

          enabled: true,
        },
      });

    const lettingsManagerPermissions =
      await prisma.permission.findMany({
        where: {
          code: {
            in:
              lettingsManagerCodes,
          },
        },
      });

    for (
      const role of
      lettingsManagerRoles
    ) {
      for (
        const permission of
        lettingsManagerPermissions
      ) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId:
                permission.id,
            },
          },

          update: {
            accessLevel:
              AccessLevel.MANAGE,
          },

          create: {
            roleId: role.id,
            permissionId:
              permission.id,

            accessLevel:
              AccessLevel.MANAGE,
          },
        });
      }
    }

    console.log(
      `Lettings Manager roles updated: ${lettingsManagerRoles.length}`,
    );

    // =========================================================
    // FINANCE MANAGER
    // =========================================================

    const financeManagerCodes = [
      "DASHBOARD_VIEW",
      "PAYMENTS_VIEW",
      "PAYMENTS_MANAGE",
      "REPORTS_VIEW",
      "REPORTS_MANAGE",
      "DOCUMENTS_VIEW",
      "MESSAGES_VIEW",
      "MESSAGES_SEND",
    ];

    const financeManagerRoles =
      await prisma.role.findMany({
        where: {
          name:
            "Finance Manager",

          scope:
            RoleScope.AGENCY,

          enabled: true,
        },
      });

    const financeManagerPermissions =
      await prisma.permission.findMany({
        where: {
          code: {
            in:
              financeManagerCodes,
          },
        },
      });

    for (
      const role of
      financeManagerRoles
    ) {
      for (
        const permission of
        financeManagerPermissions
      ) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId:
                permission.id,
            },
          },

          update: {
            accessLevel:
              AccessLevel.MANAGE,
          },

          create: {
            roleId: role.id,
            permissionId:
              permission.id,

            accessLevel:
              AccessLevel.MANAGE,
          },
        });
      }
    }

    console.log(
      `Finance Manager roles updated: ${financeManagerRoles.length}`,
    );

    console.log("");
    console.log(
      "========================================",
    );

    console.log(
      "Permission seed completed successfully.",
    );

    console.log(
      `Total permissions: ${allPermissions.length}`,
    );

    console.log(
      "========================================",
    );
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(
    "Permission seed failed:",
  );

  console.error(error);

  process.exit(1);
});