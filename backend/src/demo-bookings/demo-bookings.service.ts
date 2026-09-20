import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { MailService } from "../mail/mail.service";

@Injectable()
export class DemoBookingsService {
  constructor(private readonly prisma: PrismaService, private readonly mail: MailService) {}

  async create(input: { firstName: string; lastName: string; email: string; role: string; demoDate: string; demoTime: string }) {
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    const email = input.email.trim().toLowerCase();
    const scheduledFor = new Date(`${input.demoDate}T${input.demoTime}:00`);
    if (Number.isNaN(scheduledFor.getTime()) || scheduledFor <= new Date()) throw new BadRequestException("Please choose a future demo date and time.");

    const booking = await (this.prisma as any).demoBooking.create({ data: { firstName, lastName, email, role: input.role, demoDate: input.demoDate, demoTime: input.demoTime, scheduledFor } });
    try {
      await this.mail.sendAdminDemoBookingNotification({ id: booking.id, firstName, lastName, email, role: input.role, demoDate: input.demoDate, demoTime: input.demoTime });
    } catch (error) {
      console.error("Unable to send demo booking admin notification:", error);
    }
    return { id: booking.id, status: booking.status, message: "Your TenureEx demo request has been received." };
  }
}
