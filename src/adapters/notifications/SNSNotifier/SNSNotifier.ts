import SNS from "aws-sdk/clients/sns";
import dayjs from "dayjs";
import {
  VisitCanceled,
  VisitCreated,
  VisitInvitationAccepted,
  VisitRequested,
  VisitInvitationDeclined,
  VisitTimeframeChanged,
  Employee,
  VisitorCheckedIn,
  VisitGuestsChanged
} from "../../../domain/events/events";
import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";
import { VisitRepository } from "../../../ports/database/VisitRepository";
import { Notifier } from "../../../ports/notifications/Notifier";
import { NotFoundException } from "../../../shared/exceptions/NotFoundException/NotFoundException";
import { checkForEnv } from "../../../shared/utils/checkForEnv/checkForEnv";
import { Uuid } from "../../../shared/utils/Uuid/Uuid";
import { logger } from "../../../shared/logger/logger";

interface Notification {
  title: string;
  body: string;
}

interface Data {
  MessageType: "VisitsChanged" | "VisitRequestsChanged";
  Id: Uuid;
}

export class SNSNotifier implements Notifier {
  private readonly sns = new SNS();

  private readonly platformApplicationARN = checkForEnv(process.env.PLATFORM_APPLICATION_ARN);

  constructor(
    private readonly attendeeRepository: AttendeeRepository,
    private readonly visitRepository: VisitRepository
  ) {}

  async createPlatformEndpoint(FCMToken: string) {
    const platformEndpoint = await this.sns
      .createPlatformEndpoint({
        PlatformApplicationArn: this.platformApplicationARN,
        Token: FCMToken
      })
      .promise();

    return platformEndpoint.EndpointArn!;
  }

  async removePlatformEndpoint(platformEndpointARN: string) {
    const endpoint = await this.sns
      .getEndpointAttributes({ EndpointArn: platformEndpointARN })
      .promise();

    if (!endpoint) {
      throw new NotFoundException("FCM Token not found");
    }

    await this.sns
      .deleteEndpoint({
        EndpointArn: platformEndpointARN
      })
      .promise();
  }

  private async publishMessage(targetARN: string, notification: Notification, data: Data) {
    const message = {
      default: "default",
      GCM: JSON.stringify({
        notification,
        data
      })
    };

    try {
      await this.sns
        .publish({
          Message: JSON.stringify(message),
          TargetArn: targetARN,
          MessageStructure: "json"
        })
        .promise();
    } catch (err) {
      const disabledEndpointMessage = "Endpoint is disabled";

      if ((err as Error).message === disabledEndpointMessage) {
        logger.info({ targetARN }, disabledEndpointMessage);
      } else {
        throw new Error((err as Error)?.message);
      }
    }
  }

  private async getVisitEmployeesPlatformARNEndpoints(guests: Employee[]): Promise<string[]> {
    const employeesPromises = guests.map(async ({ email }) =>
      this.attendeeRepository.findByEmail(email)
    );

    const employees = await Promise.all(employeesPromises);

    return employees
      .map((employee) => {
        return employee!.snsPlatformEndpoints!.map(
          ({ snsPlatformEndpointARN }) => snsPlatformEndpointARN
        );
      })
      .flat();
  }

  async notifyAboutVisitCreation(event: VisitCreated) {
    const data: Data = {
      MessageType: "VisitsChanged",
      Id: event.payload.id
    };

    const notification: Notification = {
      title: "New visit was created!",
      body: `There's a new visit created by ${event.payload.hostEmail}`
    };

    const employeesPlatformEndpointARNS = await this.getVisitEmployeesPlatformARNEndpoints(
      event.payload.guests.filter((guest) => guest.type === "employee") as Employee[]
    );

    const allNotificationsPromises = employeesPlatformEndpointARNS.map((snsPlatformEndpointARN) =>
      this.publishMessage(snsPlatformEndpointARN, notification, data)
    );

    await Promise.all(allNotificationsPromises);
  }

  async notifyAboutVisitInvitationAcceptation(event: VisitInvitationAccepted) {
    const { hostEmail, title } = await this.visitRepository.findById(event.payload.id);

    const host = await this.attendeeRepository.findByEmail(hostEmail);

    const notification: Notification = {
      title: "Your invitation was accepted!",
      body: `Invitation to your visit ${title} was accepted`
    };

    const data: Data = {
      MessageType: "VisitsChanged",
      Id: event.payload.id
    };

    const promises = host.snsPlatformEndpoints!.map(({ snsPlatformEndpointARN }) =>
      this.publishMessage(snsPlatformEndpointARN, notification, data)
    );

    await Promise.all(promises);
  }

  async notifyAboutVisitInvitationDecline(event: VisitInvitationDeclined) {
    const { hostEmail, title } = await this.visitRepository.findById(event.payload.id);

    const host = await this.attendeeRepository.findByEmail(hostEmail);

    const notification: Notification = {
      title: "Your invitation was declined!",
      body: `Invitation to your visit ${title} was declined`
    };

    const data: Data = {
      MessageType: "VisitsChanged",
      Id: event.payload.id
    };

    const promises = host.snsPlatformEndpoints!.map(({ snsPlatformEndpointARN }) =>
      this.publishMessage(snsPlatformEndpointARN, notification, data)
    );

    await Promise.all(promises);
  }

  async notifyAboutVisitCancelation(event: VisitCanceled) {
    const { guests, title } = await this.visitRepository.findById(event.payload.id);

    const data: Data = {
      MessageType: "VisitsChanged",
      Id: event.payload.id
    };

    const notification: Notification = {
      title: "Meeting was canceled!",
      body: `Meeting you were invited - ${title} was canceled.`
    };

    const employeesPlatformEndpointARNS = await this.getVisitEmployeesPlatformARNEndpoints(
      guests.filter((guest) => guest.type === "employee") as Employee[]
    );

    const allNotificationsPromises = employeesPlatformEndpointARNS.map((snsPlatformEndpointARN) =>
      this.publishMessage(snsPlatformEndpointARN, notification, data)
    );

    await Promise.all(allNotificationsPromises);
  }

  async notifyAboutVisitRequested(event: VisitRequested) {
    const host = await this.attendeeRepository.findByEmail(event.payload.hostEmail);

    const notification: Notification = {
      title: "New visit was requested!",
      body: `There's a new visit request from ${event.payload.guestEmail}`
    };

    const data: Data = {
      MessageType: "VisitRequestsChanged",
      Id: event.payload.id
    };

    const promises = host.snsPlatformEndpoints!.map(({ snsPlatformEndpointARN }) =>
      this.publishMessage(snsPlatformEndpointARN, notification, data)
    );

    await Promise.all(promises);
  }

  async notifyAboutVisitTimeframeChanged(event: VisitTimeframeChanged): Promise<void> {
    const { timeframe } = event.payload;
    const { start, end } = timeframe.valueOf();
    const { guests, title } = await this.visitRepository.findById(event.payload.id);

    const visitDate = dayjs(start).format("YYYY-MM-DD");
    const startTime = dayjs(start).format("HH:mm");
    const endTime = dayjs(end).format("HH:mm");

    const data: Data = {
      MessageType: "VisitsChanged",
      Id: event.payload.id
    };

    const notification: Notification = {
      title: "Meeting time has changed!",
      body: `Meeting ${title} to which you were invited has changed time to ${visitDate} ${startTime}-${endTime}.`
    };

    const employeesPlatformEndpointARNS = await this.getVisitEmployeesPlatformARNEndpoints(
      guests.filter((guest) => guest.type === "employee") as Employee[]
    );

    const allNotificationsPromises = employeesPlatformEndpointARNS.map((snsPlatformEndpointARN) =>
      this.publishMessage(snsPlatformEndpointARN, notification, data)
    );

    await Promise.all(allNotificationsPromises);
  }

  async notifyAboutVisitorCheckedIn({
    payload: { id, invitationId }
  }: VisitorCheckedIn): Promise<void> {
    const visit = await this.visitRepository.findById(id);

    const visitor = visit.guests.find(
      ({ invitationId: guestInvitationId }) => guestInvitationId === invitationId
    )!;

    const host = await this.attendeeRepository.findByEmail(visit.hostEmail);

    const data: Data = {
      MessageType: "VisitsChanged",
      Id: id
    };

    const notification: Notification = {
      title: "Visitor just checked in!",
      body: `${visitor.name || visitor.email} has just checked in to the ${visit.title} meeting.`
    };

    const hostNotificationsPromises = host.snsPlatformEndpoints!.map(({ snsPlatformEndpointARN }) =>
      this.publishMessage(snsPlatformEndpointARN, notification, data)
    );

    await Promise.all(hostNotificationsPromises);
  }

  async notifyAboutGuestsChanged({ payload: { id, guests } }: VisitGuestsChanged): Promise<void> {
    const visit = await this.visitRepository.findById(id);
    const visitGuestsEmails = visit.guests.map(({ email }) => email);
    const newGuests = guests.filter(({ email }) => !visitGuestsEmails.includes(email));

    const data: Data = {
      MessageType: "VisitsChanged",
      Id: id
    };

    const notification: Notification = {
      title: "You were invited to the meeting!",
      body: `You were invited to the meeting created by ${visit.hostEmail}`
    };

    const employeesPlatformEndpointARNS = await this.getVisitEmployeesPlatformARNEndpoints(
      newGuests.filter((guest) => guest.type === "employee") as Employee[]
    );

    const allNotificationsPromises = employeesPlatformEndpointARNS.map((snsPlatformEndpointARN) =>
      this.publishMessage(snsPlatformEndpointARN, notification, data)
    );

    await Promise.all(allNotificationsPromises);
  }
}
