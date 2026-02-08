import { Visit } from "../../adapters/models/Visit";
import { Guest } from "../../adapters/models/Guest";
import { VisitId } from "../../domain/valueObjects/VisitId/VisitId";
import { mockEndISODate, mockStartISODate } from "./mockDates";
import { VisitRoom } from "../../adapters/models/VisitRoom";

interface MockVisitProps {
  id?: VisitId;
  hostEmail?: string;
  startDate?: string;
  endDate?: string;
  guests?: Guest[];
  room?: VisitRoom;
}

export const getMockVisit = ({
  id,
  hostEmail,
  startDate,
  endDate,
  guests,
  room
}: MockVisitProps = {}) =>
  Visit.create({
    id: id || "id",
    status: "created",
    guests: guests || [],
    host: {
      email: hostEmail || "host@email.com",
      name: "name",
      type: "employee"
    },
    timeframe: { start: startDate || mockStartISODate, end: endDate || mockEndISODate },
    title: "title",
    room
  });
