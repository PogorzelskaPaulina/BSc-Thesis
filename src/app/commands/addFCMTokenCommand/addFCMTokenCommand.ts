import { SNSNotifier } from "../../../adapters/notifications/SNSNotifier/SNSNotifier";
import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";
import { NotModifiedException } from "../../../shared/exceptions/NotModifiedException/NotModifiedException";

export interface Input {
  email: string;
  FCMToken: string;
}

export interface Context {
  attendeeRepository: AttendeeRepository;
  snsNotifier: SNSNotifier;
}

export const addFCMTokenCommand = async (
  { email, FCMToken }: Input,
  { attendeeRepository, snsNotifier }: Context
): Promise<void | undefined> => {
  const host = await attendeeRepository.findByEmail(email);

  const storedSNSPlatformEndpoint = host.snsPlatformEndpoints?.find(
    (snsPlatformEndpoint) => snsPlatformEndpoint.FCMToken === FCMToken
  );

  if (storedSNSPlatformEndpoint) {
    throw new NotModifiedException("Endpoint already stored");
  }

  const platformEndpoint = await snsNotifier.createPlatformEndpoint(FCMToken);

  return attendeeRepository.addPlatformEndpoint(email, {
    FCMToken,
    snsPlatformEndpointARN: platformEndpoint
  });
};
