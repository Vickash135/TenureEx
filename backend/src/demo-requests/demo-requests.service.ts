import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../database/prisma.service";
import { MailService } from "../mail/mail.service";

@Injectable()
export class DemoRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async create(rawEmail: string) {
    const email = rawEmail.trim().toLowerCase();

    const existing = await (this.prisma as any).demoRequest.findUnique({
      where: { email },
    });

    const request = existing
      ? await (this.prisma as any).demoRequest.update({
          where: { id: existing.id },
          data: {
            status: "PENDING",
            requestedAt: new Date(),
            reviewedAt: null,
            reviewedByUserId: null,
          },
        })
      : await (this.prisma as any).demoRequest.create({
          data: { email },
        });

    try {
      await this.mail.sendAdminDemoRequestNotification({
        email,
        requestId: request.id,
      });
    } catch (error) {
      console.error("Unable to send demo request admin notification:", error);
    }

    return {
      id: request.id,
      status: request.status,
      message:
        "Thank you. Your TenureEx demo request has been received and is awaiting review.",
    };
  }

  list() {
    return (this.prisma as any).demoRequest.findMany({
      orderBy: { requestedAt: "desc" },
    });
  }

  async approve(id: string, adminUserId: string) {
    const request = await (this.prisma as any).demoRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException("Demo request was not found.");
    }

    const updated = await (this.prisma as any).demoRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedByUserId: adminUserId,
      },
    });

    await this.mail.sendDemoAccessApproved({
      email: updated.email,
    });

    return updated;
  }

  async reject(id: string, adminUserId: string) {
    const request = await (this.prisma as any).demoRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException("Demo request was not found.");
    }

    return (this.prisma as any).demoRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedByUserId: adminUserId,
      },
    });
  }
}
