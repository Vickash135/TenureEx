import {
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";

import * as nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private readonly transporter:
    nodemailer.Transporter;

  private readonly frontendUrl: string;

  private readonly from: string;

  private readonly adminEmail: string;

  constructor() {
    const host =
      process.env.MAIL_HOST;

    const port =
      Number(
        process.env.MAIL_PORT ||
          587,
      );

    const secure =
      process.env.MAIL_SECURE ===
      "true";

    const user =
      process.env.MAIL_USER;

    const password =
      process.env.MAIL_PASSWORD;

    if (!host) {
      throw new Error(
        "MAIL_HOST is missing.",
      );
    }

    if (!user) {
      throw new Error(
        "MAIL_USER is missing.",
      );
    }

    if (!password) {
      throw new Error(
        "MAIL_PASSWORD is missing.",
      );
    }

    this.frontendUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:8081";

    this.from =
      process.env.MAIL_FROM ||
      user;

    this.adminEmail =
      process.env
        .TENUREEX_ADMIN_EMAIL ||
      "kepraaonline@gmail.com";

    this.transporter =
      nodemailer.createTransport({
        host,
        port,
        secure,

        auth: {
          user,
          pass: password,
        },
      });

    console.log(
      `[TenureEx Mail] SMTP sender=${user}; admin notifications=${this.adminEmail}`,
    );

    if (
      user.trim().toLowerCase() ===
      this.adminEmail.trim().toLowerCase()
    ) {
      console.warn(
        "[TenureEx Mail] MAIL_USER and TENUREEX_ADMIN_EMAIL are the same Gmail address. SMTP can send the message, but Gmail may treat it as self-sent mail instead of a normal new Inbox notification. For reliable Admin notifications, use a separate SMTP sender mailbox and keep TENUREEX_ADMIN_EMAIL=kepraaonline@gmail.com.",
      );
    }
  }

  // =========================================================
  // ESTATE AGENT EMAIL VERIFICATION
  // =========================================================

  async sendAgentEmailVerification(
    params: {
      email: string;
      firstName: string;
      userId: string;
      verificationCode: string;
    },
  ) {
    await this.sendMail({
      to: params.email,

      subject:
        "Your TenureEx email verification code",

      heading:
        "Verify your email address",

      greeting:
        `Hello ${params.firstName},`,

      message: `
Thank you for registering as an Estate Agent with TenureEx.

Your 6-digit email verification code is:

${params.verificationCode}

Enter this code on the Estate Agent registration page. The code is valid for 24 hours.
      `.trim(),

      footer:
        "If you did not create this registration, you can safely ignore this email.",
    });

    return {
      message:
        "Estate Agent email verification code sent successfully.",
    };
  }

  // =========================================================
  // TENANT EMAIL VERIFICATION
  // =========================================================

  async sendTenantEmailVerification(
    params: {
      email: string;
      verificationCode: string;
    },
  ) {
    await this.sendMail({
      to: params.email,
      subject: "Your TenureEx tenant verification code",
      heading: "Verify your email",
      greeting: "Hello,",
      message: `
Use the 6-digit code below to continue creating your TenureEx tenant account.

${params.verificationCode}

This code will expire in 10 minutes.
      `.trim(),
      footer: "If you did not start a tenant registration with TenureEx, you can safely ignore this email.",
    });

    return {
      message: "Tenant verification code sent successfully.",
    };
  }

  // =========================================================
  // REQUEST MORE INFORMATION
  // ADMIN -> ESTATE AGENT
  // =========================================================

  async sendAgentMoreInformationRequest(
    params: {
      email: string;
      firstName: string;
      applicationId: string;
      message: string;
    },
  ) {
    const statusUrl =
      `${this.frontendUrl}` +
      `/auth/agent/application-status`;

    await this.sendMail({
      to: params.email,

      subject:
        "More information required for your TenureEx application",

      heading:
        "More information required",

      greeting:
        `Hello ${params.firstName},`,

      message: `
The TenureEx review team needs some additional information before your Estate Agent application can continue.

Information requested:

${params.message}

Please open your application and provide the requested information.
      `.trim(),

      buttonText:
        "View application",

      buttonUrl:
        statusUrl,

      footer:
        `Application reference: ${params.applicationId}`,
    });

    return {
      message:
        "More information request email sent successfully.",
    };
  }

  // =========================================================
  // AGENT RESPONSE RECEIVED
  // ESTATE AGENT -> ADMIN
  // =========================================================

  async sendAdminAgentInformationResponseNotification(
    params: {
      applicationId: string;
      applicantName: string;
      businessName?: string | null;
      email: string;
      response: string;
    },
  ) {
    const adminUrl =
      `${this.frontendUrl}` +
      `/admin/dashboard`;

    await this.sendMail({
      to: this.adminEmail,

      subject:
        "Estate Agent information response received",

      heading:
        "Information response received",

      greeting:
        "Hello TenureEx Admin,",

      message: `
An Estate Agent has responded to a request for more information.

Applicant:
${params.applicantName}

Business:
${params.businessName || "Individual registration"}

Email:
${params.email}

Response:

${params.response}

Please review the response in the TenureEx Admin Portal.
      `.trim(),

      buttonText:
        "Open Admin Portal",

      buttonUrl:
        adminUrl,

      footer:
        `Application reference: ${params.applicationId}`,
    });

    return {
      message:
        "Admin information response notification sent successfully.",
    };
  }

  // =========================================================
  // SEND ESTATE AGENT AGREEMENT
  // ADMIN -> ESTATE AGENT
  // =========================================================

  async sendAgentAgreement(
    params: {
      email: string;
      firstName: string;
      applicationId: string;
      agreementToken?: string;
    },
  ) {
    let agreementUrl =
      `${this.frontendUrl}` +
      `/auth/agent/agreement`;

    if (params.agreementToken) {
      agreementUrl +=
        `?token=${encodeURIComponent(
          params.agreementToken,
        )}`;
    }

    await this.sendMail({
      to: params.email,

      subject:
        "Your TenureEx Estate Agent agreement is ready",

      heading:
        "Your agreement is ready",

      greeting:
        `Hello ${params.firstName},`,

      message: `
Your Estate Agent application has been authorised by TenureEx.

The next step is to review and sign the TenureEx Estate Agent Service Agreement.

Please open the agreement using the button below.
      `.trim(),

      buttonText:
        "Review and sign agreement",

      buttonUrl:
        agreementUrl,

      footer:
        `Application reference: ${params.applicationId}`,
    });

    return {
      message:
        "Estate Agent agreement email sent successfully.",
    };
  }

  // =========================================================
  // AGREEMENT SIGNED
  // ESTATE AGENT -> ADMIN
  // =========================================================

  async sendAdminAgreementSignedNotification(
    params: {
      applicationId: string;
      applicantName: string;
      businessName?: string | null;
      email: string;
    },
  ) {
    const adminUrl =
      `${this.frontendUrl}` +
      `/admin/dashboard`;

    await this.sendMail({
      to: this.adminEmail,

      subject:
        "Estate Agent agreement signed",

      heading:
        "Agreement signed",

      greeting:
        "Hello TenureEx Admin,",

      message: `
The Estate Agent has signed the TenureEx service agreement.

Applicant:
${params.applicantName}

Business:
${params.businessName || "Individual registration"}

Email:
${params.email}

The application is now ready for the Direct Debit setup stage.
      `.trim(),

      buttonText:
        "Review application",

      buttonUrl:
        adminUrl,

      footer:
        `Application reference: ${params.applicationId}`,
    });

    return {
      message:
        "Agreement signed notification sent to admin.",
    };
  }

  // =========================================================
  // DIRECT DEBIT REQUEST
  // ADMIN -> ESTATE AGENT
  // =========================================================

  async sendAgentDirectDebitRequest(
    params: {
      email: string;
      firstName: string;
      applicationId: string;
    },
  ) {
    const directDebitUrl =
      `${this.frontendUrl}` +
      `/auth/agent/direct-debit`;

    await this.sendMail({
      to: params.email,

      subject:
        "Set up your TenureEx Direct Debit",

      heading:
        "Direct Debit setup required",

      greeting:
        `Hello ${params.firstName},`,

      message: `
Your TenureEx Estate Agent agreement has been completed.

The next step is to complete your Direct Debit setup.

Please use the secure TenureEx onboarding page below to continue.
      `.trim(),

      buttonText:
        "Set up Direct Debit",

      buttonUrl:
        directDebitUrl,

      footer:
        `Application reference: ${params.applicationId}`,
    });

    return {
      message:
        "Direct Debit request email sent successfully.",
    };
  }

  // =========================================================
  // DIRECT DEBIT SUBMITTED
  // ESTATE AGENT -> ADMIN
  // =========================================================

  async sendAdminDirectDebitSubmittedNotification(
    params: {
      applicationId: string;
      applicantName: string;
      businessName?: string | null;
      email: string;
    },
  ) {
    const adminUrl =
      `${this.frontendUrl}` +
      `/admin/dashboard`;

    await this.sendMail({
      to: this.adminEmail,

      subject:
        "Estate Agent Direct Debit submitted",

      heading:
        "Direct Debit submitted",

      greeting:
        "Hello TenureEx Admin,",

      message: `
An Estate Agent has completed the Direct Debit submission.

Applicant:
${params.applicantName}

Business:
${params.businessName || "Individual registration"}

Email:
${params.email}

Please review and validate the Direct Debit setup in the TenureEx Admin Portal.
      `.trim(),

      buttonText:
        "Validate Direct Debit",

      buttonUrl:
        adminUrl,

      footer:
        `Application reference: ${params.applicationId}`,
    });

    return {
      message:
        "Direct Debit submission notification sent to admin.",
    };
  }

  // =========================================================
  // FINAL ESTATE AGENT APPROVAL
  // ADMIN -> ESTATE AGENT
  // =========================================================

  async sendAgentApprovalAndPasswordSetup(
    params: {
      email: string;
      firstName: string;
      applicationId: string;
      passwordToken: string;
    },
  ) {
    const passwordUrl =
      `${this.frontendUrl}` +
      `/auth/agent/set-password` +
      `?token=${encodeURIComponent(
        params.passwordToken,
      )}`;

    await this.sendMail({
      to: params.email,

      subject:
        "Your TenureEx Estate Agent account has been approved",

      heading:
        "Your account has been approved",

      greeting:
        `Hello ${params.firstName},`,

      message: `
Your TenureEx Estate Agent application has successfully completed the approval process.

Your account is now approved.

Before signing in for the first time, please create your secure password.
      `.trim(),

      buttonText:
        "Create your password",

      buttonUrl:
        passwordUrl,

      footer:
        `Application reference: ${params.applicationId}

This password setup link is intended only for you.`,
    });

    return {
      message:
        "Estate Agent approval email sent successfully.",
    };
  }

  // =========================================================
  // EXISTING AGENCY USER INVITATION
  // KEEP THIS - USED BY AGENCY USER MANAGEMENT
  // =========================================================

  async sendAgencyUserInvitation(
    params: {
      email: string;
      firstName: string;
      invitationToken: string;
    },
  ) {
    const invitationUrl =
      `${this.frontendUrl}` +
      `/auth/agent/set-password` +
      `?token=${encodeURIComponent(
        params.invitationToken,
      )}`;

    await this.sendMail({
      to: params.email,

      subject:
        "You're invited to TenureEx",

      heading:
        "You're invited",

      greeting:
        `Hello ${params.firstName},`,

      message: `
Your agency administrator has invited you to join TenureEx.

Create your password to activate your account.
      `.trim(),

      buttonText:
        "Create password",

      buttonUrl:
        invitationUrl,

      footer:
        "This invitation expires in 24 hours. If you were not expecting this invitation, you can safely ignore this email.",
    });

    return {
      message:
        "Invitation email sent successfully.",
    };
  }

  // =========================================================
  // LANDLORD EMAIL VERIFICATION
  // =========================================================

  async sendLandlordEmailVerification(
    params: {
      email: string;
      firstName: string;
      verificationCode: string;
    },
  ) {
    await this.sendMail({
      to: params.email,
      subject: "Your TenureEx landlord email verification code",
      heading: "Verify your email address",
      greeting: `Hello ${params.firstName},`,
      message: `
Thank you for registering as a Landlord with TenureEx.

Your 6-digit email verification code is:

${params.verificationCode}

Enter this code on the Landlord registration page to continue. The code is valid for 30 minutes.
      `.trim(),
      footer: "If you did not start this registration, you can safely ignore this email.",
    });

    return { message: "Landlord email verification code sent successfully." };
  }

  // =========================================================
  // LANDLORD INVITATION FROM ESTATE AGENT
  // =========================================================

  async sendLandlordAgencyInvitation(
    params: {
      email: string;
      firstName: string;
      agencyName: string;
      invitationToken: string;
    },
  ) {
    const invitationUrl =
      `${this.frontendUrl}/auth/landlord/signup` +
      `?invite=${encodeURIComponent(params.invitationToken)}` +
      `&email=${encodeURIComponent(params.email)}`;

    await this.sendMail({
      to: params.email,
      subject: `${params.agencyName} invited you to TenureEx`,
      heading: "Landlord invitation",
      greeting: `Hello ${params.firstName},`,
      message: `${params.agencyName} has invited you to join their TenureEx landlord portfolio. Complete your landlord registration using the secure invitation link below. Once joined, properties you submit will be sent to the agency for approval.`,
      buttonText: "Accept landlord invitation",
      buttonUrl: invitationUrl,
      footer: "This invitation expires in 7 days.",
    });

    return { message: "Landlord invitation email sent successfully." };
  }

  async sendAgencyPropertyReviewNotification(
    params: {
      email: string;
      agencyName: string;
      landlordName: string;
      address: string;
    },
  ) {
    await this.sendMail({
      to: params.email,
      subject: "Property waiting for approval",
      heading: "Property approval required",
      greeting: `Hello ${params.agencyName},`,
      message: `${params.landlordName} submitted ${params.address}. The property is now waiting for an Estate Agent review.`,
      buttonText: "Review properties",
      buttonUrl: `${this.frontendUrl}/agent/properties`,
      footer: "TenureEx property approval workflow",
    });
  }

  async sendLandlordPropertyDecision(
    params: {
      email: string;
      firstName: string;
      address: string;
      agencyName: string;
      approved: boolean;
      reason?: string;
    },
  ) {
    await this.sendMail({
      to: params.email,
      subject: params.approved ? "Your property has been approved" : "Property changes required",
      heading: params.approved ? "Property approved" : "Property not approved",
      greeting: `Hello ${params.firstName},`,
      message: params.approved
        ? `${params.agencyName} approved ${params.address}. The property is now approved in TenureEx.`
        : `${params.agencyName} reviewed ${params.address} and did not approve it. Reason: ${params.reason ?? "Please review the property information and resubmit."}`,
      buttonText: "Open landlord properties",
      buttonUrl: `${this.frontendUrl}/landlord/properties`,
      footer: params.approved ? "No further action is required." : "Edit the property and save it again to return it to the approval queue.",
    });
  }

  // =========================================================
  // GENERIC ADMIN NOTIFICATION
  // OPTIONAL HELPER
  // =========================================================

  async sendAdminNotification(
    params: {
      subject: string;
      heading: string;
      message: string;
      applicationId?: string;
    },
  ) {
    const adminUrl =
      `${this.frontendUrl}` +
      `/admin/dashboard`;

    await this.sendMail({
      to: this.adminEmail,

      subject:
        params.subject,

      heading:
        params.heading,

      greeting:
        "Hello TenureEx Admin,",

      message:
        params.message,

      buttonText:
        "Open Admin Portal",

      buttonUrl:
        adminUrl,

      footer:
        params.applicationId
          ? `Application reference: ${params.applicationId}`
          : undefined,
    });
  }

  // =========================================================
  // VERIFY SMTP CONNECTION
  // =========================================================

  async verifyConnection() {
    try {
      await this.transporter.verify();

      return {
        connected: true,
        adminEmail:
          this.adminEmail,
      };
    } catch (error) {
      console.error(
        "Mail connection failed:",
        error,
      );

      return {
        connected: false,
      };
    }
  }

  // =========================================================
  // INTERNAL EMAIL TEMPLATE
  // =========================================================

  private async sendMail(
    params: {
      to: string;
      subject: string;
      heading: string;
      greeting: string;
      message: string;
      buttonText?: string;
      buttonUrl?: string;
      footer?: string;
    },
  ) {
    const escapedMessage =
      this.escapeHtml(
        params.message,
      ).replace(
        /\n/g,
        "<br />",
      );

    const escapedGreeting =
      this.escapeHtml(
        params.greeting,
      );

    const escapedFooter =
      params.footer
        ? this.escapeHtml(
            params.footer,
          ).replace(
            /\n/g,
            "<br />",
          )
        : "";

    const button =
      params.buttonText &&
      params.buttonUrl
        ? `
          <table
            cellpadding="0"
            cellspacing="0"
            style="
              margin:28px 0;
            "
          >
            <tr>
              <td>
                <a
                  href="${this.escapeAttribute(
                    params.buttonUrl,
                  )}"
                  style="
                    display:inline-block;
                    padding:14px 24px;
                    background:#0f6277;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:10px;
                    font-weight:700;
                  "
                >
                  ${this.escapeHtml(
                    params.buttonText,
                  )}
                </a>
              </td>
            </tr>
          </table>
        `
        : "";

    try {
      const info =
        await this.transporter.sendMail({
        from:
          this.from,

        to:
          params.to,

        subject:
          params.subject,

        text: `
${params.greeting}

${params.message}

${
  params.buttonUrl
    ? params.buttonUrl
    : ""
}

${params.footer || ""}

TenureEx
        `.trim(),

        html: `
<!DOCTYPE html>

<html>
<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f4f7f8;
    font-family:Arial,Helvetica,sans-serif;
    color:#102b3a;
  "
>
  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    role="presentation"
    style="
      background:#f4f7f8;
      padding:40px 16px;
    "
  >
    <tr>
      <td align="center">

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          role="presentation"
          style="
            max-width:620px;
            background:#ffffff;
            border:1px solid #e3eaed;
            border-radius:14px;
            overflow:hidden;
          "
        >
          <tr>
            <td
              style="
                padding:26px 32px;
                background:#0f6277;
                color:#ffffff;
              "
            >
              <div
                style="
                  font-size:25px;
                  line-height:1.2;
                  font-weight:700;
                "
              >
                TenureEx
              </div>

              <div
                style="
                  margin-top:5px;
                  font-size:12px;
                  color:#d9edf2;
                "
              >
                Property management platform
              </div>
            </td>
          </tr>

          <tr>
            <td
              style="
                padding:36px 32px;
              "
            >
              <h1
                style="
                  margin:0 0 20px;
                  font-size:25px;
                  line-height:1.3;
                  color:#102b3a;
                "
              >
                ${this.escapeHtml(
                  params.heading,
                )}
              </h1>

              <p
                style="
                  margin:0 0 18px;
                  color:#536b78;
                  font-size:15px;
                  line-height:1.7;
                "
              >
                ${escapedGreeting}
              </p>

              <p
                style="
                  margin:0;
                  color:#536b78;
                  font-size:15px;
                  line-height:1.7;
                "
              >
                ${escapedMessage}
              </p>

              ${button}

              ${
                escapedFooter
                  ? `
                    <div
                      style="
                        margin-top:26px;
                        padding-top:20px;
                        border-top:1px solid #e3eaed;
                        font-size:12px;
                        line-height:1.7;
                        color:#82939c;
                      "
                    >
                      ${escapedFooter}
                    </div>
                  `
                  : ""
              }

            </td>
          </tr>

          <tr>
            <td
              style="
                padding:20px 32px;
                background:#f8fafb;
                border-top:1px solid #e3eaed;
                color:#82939c;
                font-size:11px;
                line-height:1.6;
              "
            >
              This email was sent by TenureEx.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });

      console.log(
        `[TenureEx Mail] sent "${params.subject}" to ${params.to}; messageId=${info.messageId}`,
      );
    } catch (error) {
      console.error(
        `Email failed to ${params.to}:`,
        error,
      );

      throw new InternalServerErrorException(
        "Unable to send email.",
      );
    }
  }

  // =========================================================
  // HTML SAFETY HELPERS
  // =========================================================

  private escapeHtml(
    value: string,
  ) {
    return value
      .replace(
        /&/g,
        "&amp;",
      )
      .replace(
        /</g,
        "&lt;",
      )
      .replace(
        />/g,
        "&gt;",
      )
      .replace(
        /"/g,
        "&quot;",
      )
      .replace(
        /'/g,
        "&#039;",
      );
  }

  private escapeAttribute(
    value: string,
  ) {
    return this.escapeHtml(
      value,
    );
  }
}