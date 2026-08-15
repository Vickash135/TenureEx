import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { PrismaService } from "./database/prisma.service";

async function main() {
  const app = await NestFactory.createApplicationContext(
    AppModule,
    {
      logger: ["error", "warn", "log"],
    },
  );

  const prisma = app.get(PrismaService);

  try {
    const primaryAgencyUser =
      await prisma.agencyUser.findFirst({
        where: {
          isPrimary: true,
          user: {
            email: "shamini@gmail.com",
          },
        },
        include: {
          agency: true,
          user: true,
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

    if (!primaryAgencyUser) {
      throw new Error(
        "Primary agency user for shamini@gmail.com was not found.",
      );
    }

    const agencyId = primaryAgencyUser.agencyId;

    console.log(
      "Agency:",
      primaryAgencyUser.agency.name,
    );

    console.log(
      "Agency ID:",
      agencyId,
    );

    /*
     * ---------------------------------------------------------
     * BRANCHES
     * ---------------------------------------------------------
     */

    const branchData = [
      {
        name: "Head Office",
        email: "shamini@gmail.com",
        phone: primaryAgencyUser.user.phone,
        address: "Main Office",
        postcode: null,
      },
      {
        name: "Branch 2",
        email: null,
        phone: null,
        address: null,
        postcode: null,
      },
      {
        name: "Branch 3",
        email: null,
        phone: null,
        address: null,
        postcode: null,
      },
      {
        name: "Branch 4",
        email: null,
        phone: null,
        address: null,
        postcode: null,
      },
      {
        name: "Branch 5",
        email: null,
        phone: null,
        address: null,
        postcode: null,
      },
      {
        name: "Branch 6",
        email: null,
        phone: null,
        address: null,
        postcode: null,
      },
      {
        name: "Branch 7",
        email: null,
        phone: null,
        address: null,
        postcode: null,
      },
    ];

    for (const branch of branchData) {
      await prisma.agencyBranch.upsert({
        where: {
          agencyId_name: {
            agencyId,
            name: branch.name,
          },
        },
        update: {
          email: branch.email,
          phone: branch.phone,
          address: branch.address,
          postcode: branch.postcode,
          active: true,
        },
        create: {
          agencyId,
          name: branch.name,
          email: branch.email,
          phone: branch.phone,
          address: branch.address,
          postcode: branch.postcode,
          active: true,
        },
      });
    }

    /*
     * ---------------------------------------------------------
     * ROLES
     * ---------------------------------------------------------
     */

    const roleData = [
      {
        code: `AGENCY_ADMIN_${agencyId}`,
        name: "Agency Administrator",
        description:
          "Full agency administration access.",
      },
      {
        code: `PROPERTY_MANAGER_${agencyId}`,
        name: "Property Manager",
        description:
          "Manage properties, landlords, tenants and maintenance.",
      },
      {
        code: `LETTINGS_MANAGER_${agencyId}`,
        name: "Lettings Manager",
        description:
          "Manage applicants, tenancies and lettings.",
      },
      {
        code: `FINANCE_MANAGER_${agencyId}`,
        name: "Finance Manager",
        description:
          "Manage payments and financial information.",
      },
      {
        code: `AGENCY_STAFF_${agencyId}`,
        name: "Agency Staff",
        description:
          "Standard agency staff access.",
      },
    ];

    const createdRoles = [];

    for (const role of roleData) {
      const createdRole =
        await prisma.role.upsert({
          where: {
            code: role.code,
          },
          update: {
            name: role.name,
            description: role.description,
            agencyId,
            scope: "AGENCY",
            enabled: true,
          },
          create: {
            agencyId,
            code: role.code,
            name: role.name,
            description: role.description,
            scope: "AGENCY",
            isSystem: false,
            enabled: true,
          },
        });

      createdRoles.push(createdRole);
    }

    /*
     * ---------------------------------------------------------
     * ASSIGN ADMIN ROLE TO PRIMARY USER
     * ---------------------------------------------------------
     */

    const adminRole = createdRoles.find(
      (role) =>
        role.name === "Agency Administrator",
    );

    if (!adminRole) {
      throw new Error(
        "Agency Administrator role was not created.",
      );
    }

    await prisma.agencyUserRole.upsert({
      where: {
        agencyUserId_roleId: {
          agencyUserId: primaryAgencyUser.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        agencyUserId: primaryAgencyUser.id,
        roleId: adminRole.id,
      },
    });

    /*
     * ---------------------------------------------------------
     * ASSIGN PRIMARY USER TO HEAD OFFICE
     * ---------------------------------------------------------
     */

    const headOffice =
      await prisma.agencyBranch.findUnique({
        where: {
          agencyId_name: {
            agencyId,
            name: "Head Office",
          },
        },
      });

    if (headOffice) {
      await prisma.agencyUser.update({
        where: {
          id: primaryAgencyUser.id,
        },
        data: {
          branchId: headOffice.id,
          jobTitle: "Agency Administrator",
        },
      });
    }

    console.log("");
    console.log("================================");
    console.log("Agency setup completed");
    console.log("================================");
    console.log(
      "Agency:",
      primaryAgencyUser.agency.name,
    );
    console.log(
      "Primary user:",
      primaryAgencyUser.user.email,
    );
    console.log(
      "Primary role:",
      adminRole.name,
    );
    console.log(
      "Branches created:",
      branchData.length,
    );
    console.log(
      "Roles created:",
      createdRoles.length,
    );
    console.log("================================");
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error("Agency setup failed:");
  console.error(error);
  process.exit(1);
});
