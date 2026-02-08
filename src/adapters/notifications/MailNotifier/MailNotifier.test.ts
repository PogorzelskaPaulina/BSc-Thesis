import dayjs from "dayjs";
import { renderFile } from "ejs";
import { createMock } from "ts-auto-mock";
import { VisitTimeframe } from "../../../domain/valueObjects/VisitTimeframe/VisitTimeframe";
import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";
import { VisitRepository } from "../../../ports/database/VisitRepository";
import { getMockVisit } from "../../../shared/tests/getMockVisit";
import { mockEndISODate, mockStartISODate } from "../../../shared/tests/mockDates";
import { Attendee } from "../../models/Attendee";
import { Guest } from "../../models/Guest";
import { MailNotifier } from "./MailNotifier";

const attendeeRepository = createMock<AttendeeRepository>({
  findByEmail: async (email) => {
    return Attendee.create({ email, name: "name", type: "visitor" });
  }
});

const guest = Guest.create({
  email: "guest@email.com",
  name: "name",
  type: "visitor",
  accepted: true,
  invitationId: "invitationId",
  pinCode: ""
});

const visitHost = Attendee.create({
  email: "host@email.com",
  name: "name",
  type: "employee"
});

const visitTitle = "title";
const visitRepository = createMock<VisitRepository>({
  findById: async (id) => {
    return getMockVisit({ id, guests: [guest] });
  }
});

const mailUser = "user";
process.env.MAIL_USER = mailUser;
process.env.MAIL_PASSWORD = "password";

const sendMailMock = jest.fn();

jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockImplementation(() => ({
    sendMail: sendMailMock
  }))
}));

const mailNotifier = new MailNotifier(attendeeRepository, visitRepository);

describe("MailNotifier", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should notify guests about created visit", async () => {
    // arrange
    const appLink = "https://www.google.com";
    process.env.INVITATION_APP_LINK = appLink;
    const event = {
      type: "VISIT_CREATED" as const,
      payload: {
        id: "id",
        hostEmail: "email@email.com",
        guests: [
          {
            accepted: null,
            email: "guest@email.com",
            invitationId: "invitationId",
            type: "visitor" as const,
            checkedIn: false,
            pinCode: ""
          }
        ],
        status: "created" as const,
        timeframe: VisitTimeframe.from(mockStartISODate, mockEndISODate),
        title: "title"
      }
    };
    const templateData = {
      title: event.payload.title,
      guest: { email: event.payload.guests[0].email, type: "visitor" },
      host: { name: "name" },
      invitationId: event.payload.guests[0].invitationId,
      date: dayjs(event.payload.timeframe.valueOf().start).format("YYYY-MM-DD"),
      startTime: dayjs(event.payload.timeframe.valueOf().start).format("HH:mm"),
      endTime: dayjs(event.payload.timeframe.valueOf().end).format("HH:mm"),
      appLink: `${appLink}?invitationId=${event.payload.guests[0].invitationId}&visitId=${event.payload.id}`
    };
    const html = await renderFile(
      "src/adapters/notifications/MailNotifier/templates/invitation.ejs",
      templateData
    );

    // act
    await mailNotifier.notifyAboutVisitCreation(event);

    // assert
    expect(sendMailMock).toHaveBeenNthCalledWith(1, {
      from: mailUser,
      html,
      to: event.payload.guests[0].email,
      subject: "Invitation to title"
    });
  });

  test("should notify host about visit accepted by guest", async () => {
    // arrange
    const event = {
      type: "VISIT_INVITATION_ACCEPTED" as const,
      payload: {
        id: "id",
        invitationId: "invitationId"
      }
    };

    const templateData = {
      title: visitTitle,
      displayName: "name"
    };

    const html = await renderFile(
      "src/adapters/notifications/MailNotifier/templates/invitationAccepted.ejs",
      templateData
    );

    // act
    await mailNotifier.notifyAboutVisitInvitationAcceptation(event);

    // assert
    expect(sendMailMock).toHaveBeenNthCalledWith(1, {
      from: mailUser,
      html,
      to: visitHost.email,
      subject: `Invitation to ${visitTitle} was accepted`
    });
  });

  test("should notify guests about visit cancelation", async () => {
    // arrange
    const event = {
      type: "VISIT_CANCELED" as const,
      payload: {
        id: "id"
      }
    };

    const templateData = {
      title: visitTitle,
      host: { name: "name" }
    };

    const html = await renderFile(
      "src/adapters/notifications/MailNotifier/templates/visitCanceled.ejs",
      templateData
    );

    // act
    await mailNotifier.notifyAboutVisitCancelation(event);

    // assert
    expect(sendMailMock).toHaveBeenNthCalledWith(1, {
      from: mailUser,
      html,
      to: [guest.email],
      subject: "Canceled meeting"
    });
  });

  test("should notify host about visit requested", async () => {
    // arrange
    const hostEmail = "host@email.com";
    const event = {
      type: "VISIT_REQUESTED" as const,
      payload: {
        requestDate: mockStartISODate,
        duration: 45,
        guestEmail: "",
        hostEmail,
        id: "",
        title: "",
        status: "requested" as const
      }
    };

    const templateData = {
      title: visitTitle,
      displayName: "name"
    };

    const html = await renderFile(
      "src/adapters/notifications/MailNotifier/templates/visitRequested.ejs",
      templateData
    );

    // act
    await mailNotifier.notifyAboutVisitRequested(event);

    // assert
    expect(sendMailMock).toHaveBeenNthCalledWith(1, {
      from: mailUser,
      html,
      to: hostEmail,
      subject: `Visit requested by ${guest.name}`
    });
  });
});
