import { VisitRequest } from "../../adapters/models/VisitRequest";
import { Attendee } from "../../adapters/models/Attendee";
import { VisitId } from "../../domain/valueObjects/VisitId/VisitId";
import { mockStartISODate } from "./mockDates";
import { VisitRoom } from "../../adapters/models/VisitRoom";
import { EmployeeType, VisitorType } from "../../domain/events/events";

interface MockRequestProps {
  id?: VisitId;
  host?: Attendee<EmployeeType>;
  requestDate?: string;
  duration?: number;
  guest?: Attendee<VisitorType>;
  room?: VisitRoom;
}

export const getMockRequest = ({ id, host, requestDate, duration, guest }: MockRequestProps = {}) =>
  VisitRequest.create({
    id: id || "id",
    status: "requested",
    guest: guest || {
      email: "guest@email.com",
      name: "name",
      type: "visitor"
    },
    host: host || {
      email: "host@email.com",
      name: "name",
      type: "employee"
    },
    duration: duration || 45,
    requestDate: requestDate || mockStartISODate,
    title: "title"
  });
