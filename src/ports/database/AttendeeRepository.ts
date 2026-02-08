import { Attendee } from "../../adapters/models/Attendee";

export interface SNSPlatformEndpoint {
  FCMToken: string;
  snsPlatformEndpointARN: string;
}

export interface AttendeeRepository {
  create(attendee: Attendee): Promise<void>;
  findByEmailOrNull(email: string): Promise<Attendee | null>;
  findByEmail(email: string): Promise<Attendee>;
  addPlatformEndpoint(email: string, platformEndpoint: SNSPlatformEndpoint): Promise<void>;
  removePlatformEndpoint(email: string, platformEndpointIndex: number): Promise<void>;
}
