import { SNSNotifier } from "../../../adapters/notifications/SNSNotifier/SNSNotifier";
import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";
import { NotFoundException } from "../../../shared/exceptions/NotFoundException/NotFoundException";

export interface Input {
  email: string;
  FCMToken: string;
}

export interface Context {
  attendeeRepository: AttendeeRepository;
  snsNotifier: SNSNotifier;
}

export const removeFCMTokenCommand = async (
  { email, FCMToken }: Input,
  { attendeeRepository, snsNotifier }: Context
) => {
  const host = await attendeeRepository.findByEmail(email);

  const platformEndpointIndex = host.snsPlatformEndpoints?.findIndex(
    ({ FCMToken: storedFCMToken }) => storedFCMToken === FCMToken
  );

  if (platformEndpointIndex === undefined || platformEndpointIndex === -1) {
    throw new NotFoundException("FCM Token not found");
  }

  await snsNotifier.removePlatformEndpoint(
    host.snsPlatformEndpoints![platformEndpointIndex].snsPlatformEndpointARN
  );

  await attendeeRepository.removePlatformEndpoint(email, platformEndpointIndex);
};
