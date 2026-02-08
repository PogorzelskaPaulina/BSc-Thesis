import dayjs from "dayjs";
import { createTransport } from "nodemailer";
import { renderFile } from "ejs";
import { Notifier } from "../../../ports/notifications/Notifier";
import {
  VisitCanceled,
  VisitCreated,
  VisitInvitationAccepted,
  VisitInvitationDeclined,
  VisitRequested,
  VisitTimeframeChanged,
  VisitorCheckedIn,
  VisitGuestsChanged
} from "../../../domain/events/events";
import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";
import { VisitRepository } from "../../../ports/database/VisitRepository";
import { checkForEnv } from "../../../shared/utils/checkForEnv/checkForEnv";
import { Attendee } from "../../models/Attendee";

type SupportedTemplates =
  | "invitation"
  | "invitationAccepted"
  | "visitCanceled"
  | "visitRequested"
  | "invitationDeclined"
  | "visitTimeframeChanged"
  | "pinCode"
  | "visitorCheckedIn";

export class MailNotifier implements Notifier {
  private readonly mailUser = checkForEnv(process.env.MAIL_USER);

  private readonly transporter = createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: true,
    auth: {
      user: this.mailUser,
      pass: checkForEnv(process.env.MAIL_PASSWORD)
    }
  });

  constructor(
    private readonly attendeeRepository: AttendeeRepository,
    private readonly visitRepository: VisitRepository
  ) {}

  private static getTemplateFilePath(template: SupportedTemplates) {
    switch (template) {
      case "invitation":
        return "src/adapters/notifications/MailNotifier/templates/invitation.ejs";
      case "invitationAccepted":
        return "src/adapters/notifications/MailNotifier/templates/invitationAccepted.ejs";
      case "visitRequested":
        return "src/adapters/notifications/MailNotifier/templates/visitRequested.ejs";
      case "invitationDeclined":
        return "src/adapters/notifications/MailNotifier/templates/invitationDeclined.ejs";
      case "visitTimeframeChanged":
        return "src/adapters/notifications/MailNotifier/templates/visitTimeframeChanged.ejs";
      case "pinCode":
        return "src/adapters/notifications/MailNotifier/templates/pinCode.ejs";
      case "visitorCheckedIn":
        return "src/adapters/notifications/MailNotifier/templates/visitorCheckedIn.ejs";
      default:
        return "src/adapters/notifications/MailNotifier/templates/visitCanceled.ejs";
    }
  }

  private static getGuestDisplayName(guest: Attendee) {
    return guest.name || guest.email;
  }

  async notifyAboutVisitCreation(event: VisitCreated): Promise<void> {
    const guests = await this.getGuests(event);

    const host = await this.attendeeRepository.findByEmail(event.payload.hostEmail);

    const emailsPromises = guests.map(async (guest) => {
      const templateData = {
        title: event.payload.title,
        guest,
        host,
        date: dayjs(event.payload.timeframe.valueOf().start).format("YYYY-MM-DD"),
        startTime: dayjs(event.payload.timeframe.valueOf().start).format("HH:mm"),
        endTime: dayjs(event.payload.timeframe.valueOf().end).format("HH:mm"),
        invitationId: guest.invitationId,
        appLink: `${checkForEnv(process.env.INVITATION_APP_LINK)}?invitationId=${
          guest.invitationId
        }&visitId=${event.payload.id}`
      };

      const templatePath = MailNotifier.getTemplateFilePath("invitation");

      const html = await renderFile(templatePath, templateData);

      return this.transporter.sendMail({
        from: this.mailUser,
        to: guest.email,
        subject: `Invitation to ${event.payload.title}`,
        html
      });
    });

    await Promise.all(emailsPromises);
  }

  private getGuests = (event: VisitCreated) => {
    const guestsPromises = event.payload.guests.map(async ({ email, accepted, invitationId }) => {
      const guest = await this.attendeeRepository.findByEmail(email);

      return {
        ...guest,
        accepted,
        invitationId
      };
    });

    return Promise.all(guestsPromises);
  };

  async notifyAboutVisitInvitationAcceptation(event: VisitInvitationAccepted): Promise<void> {
    const visit = await this.visitRepository.findById(event.payload.id);

    const guest = visit.guests.find(
      (storedGuest) => storedGuest.invitationId === event.payload.invitationId
    )!;

    const templateData = {
      title: visit.title,
      displayName: MailNotifier.getGuestDisplayName(guest)
    };

    const templatePath = MailNotifier.getTemplateFilePath("invitationAccepted");

    const html = await renderFile(templatePath, templateData);

    await this.transporter.sendMail({
      from: this.mailUser,
      to: visit.host.email,
      subject: `Invitation to ${visit.title} was accepted`,
      html
    });

    if (guest.type === "visitor") {
      const pinCodeTemplatePath = MailNotifier.getTemplateFilePath("pinCode");

      const guestTemplateData = {
        title: visit.title,
        guest
      };

      const pinCodeHtml = await renderFile(pinCodeTemplatePath, guestTemplateData);

      await this.transporter.sendMail({
        from: this.mailUser,
        to: guest.email,
        subject: `PIN code to ${visit.title} meeting`,
        html: pinCodeHtml
      });
    }
  }

  async notifyAboutVisitInvitationDecline(event: VisitInvitationDeclined): Promise<void> {
    const visit = await this.visitRepository.findById(event.payload.id);

    const guest = visit.guests.find(
      (visitGuests) => visitGuests.invitationId === event.payload.invitationId
    )!;

    const templateData = {
      title: visit.title,
      displayName: MailNotifier.getGuestDisplayName(guest)
    };

    const templatePath = MailNotifier.getTemplateFilePath("invitationDeclined");

    const html = await renderFile(templatePath, templateData);

    await this.transporter.sendMail({
      from: this.mailUser,
      to: visit.host.email,
      subject: `Invitation to ${visit.title} was declined`,
      html
    });
  }

  async notifyAboutVisitCancelation(event: VisitCanceled): Promise<void> {
    const visit = await this.visitRepository.findById(event.payload.id);

    const templateData = {
      title: visit.title,
      host: visit.host
    };

    const templatePath = MailNotifier.getTemplateFilePath("visitCanceled");

    const html = await renderFile(templatePath, templateData);

    await this.transporter.sendMail({
      from: this.mailUser,
      to: visit.guests.map((guest) => guest.email),
      subject: "Canceled meeting",
      html
    });
  }

  async notifyAboutVisitRequested(event: VisitRequested): Promise<void> {
    const guest = await this.attendeeRepository.findByEmail(event.payload.guestEmail);

    const templateData = {
      displayName: MailNotifier.getGuestDisplayName(guest)
    };

    const templatePath = MailNotifier.getTemplateFilePath("visitRequested");

    const html = await renderFile(templatePath, templateData);

    await this.transporter.sendMail({
      from: this.mailUser,
      to: event.payload.hostEmail,
      subject: `Visit requested by ${guest.name}`,
      html
    });
  }

  async notifyAboutVisitTimeframeChanged(event: VisitTimeframeChanged): Promise<void> {
    const { guests, title, host } = await this.visitRepository.findById(event.payload.id);

    const date = dayjs(event.payload.timeframe.valueOf().start).format("YYYY-MM-DD");
    const startTime = dayjs(event.payload.timeframe.valueOf().start).format("HH:mm");
    const endTime = dayjs(event.payload.timeframe.valueOf().end).format("HH:mm");
    const templatePath = MailNotifier.getTemplateFilePath("visitTimeframeChanged");

    const emailsPromises = guests.map(async (guest) => {
      const templateData = {
        title,
        guest,
        host,
        date,
        startTime,
        endTime
      };
      const html = await renderFile(templatePath, templateData);

      return this.transporter.sendMail({
        from: this.mailUser,
        to: guest.email,
        subject: `Time of the visit ${title} has changed`,
        html
      });
    });

    await Promise.all(emailsPromises);
  }

  async notifyAboutVisitorCheckedIn({
    payload: { id, invitationId }
  }: VisitorCheckedIn): Promise<void> {
    const visit = await this.visitRepository.findById(id);

    const visitor = visit.guests.find(
      ({ invitationId: guestInvitationId }) => guestInvitationId === invitationId
    )!;

    const templateData = {
      title: visit.title,
      displayName: visitor.name || visitor.email
    };

    const templatePath = MailNotifier.getTemplateFilePath("visitorCheckedIn");

    const html = await renderFile(templatePath, templateData);

    await this.transporter.sendMail({
      from: this.mailUser,
      to: visit.host.email,
      subject: `Visitor just checked in!`,
      html
    });
  }

  async notifyAboutGuestsChanged({ payload: { id, guests } }: VisitGuestsChanged): Promise<void> {
    const visit = await this.visitRepository.findById(id);

    const visitGuestsEmails = visit.guests.map(({ email }) => email);
    const newGuests = guests.filter(({ email }) => !visitGuestsEmails.includes(email));

    const host = await this.attendeeRepository.findByEmail(visit.hostEmail);

    const emailsPromises = newGuests.map(async (guest) => {
      const templateData = {
        title: visit.title,
        guest,
        host,
        date: dayjs(visit.timeframe.valueOf().start).format("YYYY-MM-DD"),
        startTime: dayjs(visit.timeframe.valueOf().start).format("HH:mm"),
        endTime: dayjs(visit.timeframe.valueOf().end).format("HH:mm"),
        invitationId: guest.invitationId,
        appLink: `${checkForEnv(process.env.INVITATION_APP_LINK)}?invitationId=${
          guest.invitationId
        }&visitId=${visit.id}`
      };

      const templatePath = MailNotifier.getTemplateFilePath("invitation");

      const html = await renderFile(templatePath, templateData);

      return this.transporter.sendMail({
        from: this.mailUser,
        to: guest.email,
        subject: `Invitation to ${visit.title}`,
        html
      });
    });

    await Promise.all(emailsPromises);
  }

  async sendAuditLog(email: string, requestTime: number, serializedAuditLog: string) {
    return this.transporter.sendMail({
      from: this.mailUser,
      to: email,
      subject: "Audit log",
      html: `Requested audit log on ${new Date(requestTime).toISOString()}`,
      attachments: [
        {
          filename: "audit-log.json",
          content: serializedAuditLog
        }
      ]
    });
  }
}
