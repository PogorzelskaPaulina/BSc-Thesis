import dayjs from "dayjs";

export const mockStartDate = dayjs().add(1, "day").set("hour", 10).set("minute", 0);
export const mockEndDate = dayjs().add(1, "day").set("hour", 14).set("minute", 0);

export const mockStartISODate = mockStartDate.toISOString();
export const mockEndISODate = mockEndDate.toISOString();
