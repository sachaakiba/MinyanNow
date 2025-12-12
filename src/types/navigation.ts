export type RootStackParamList = {
  PhoneAuth: undefined;
  OTPVerification: { phoneNumber: string };
  CompleteProfile: undefined;
  Home: undefined;
  CreateEvent: undefined;
  EditEvent: { eventId: string };
  EventDetail: { eventId: string };
  Profile: undefined;
  MyParticipations: undefined;
  NotificationSettings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
