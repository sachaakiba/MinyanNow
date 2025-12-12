export type RootStackParamList = {
  PhoneAuth: undefined;
  OTPVerification: { phoneNumber: string };
  CompleteProfile: undefined;
  MainTabs: undefined;
  CreateEvent: undefined;
  EditEvent: { eventId: string };
  EventDetail: { eventId: string };
  Settings: undefined;
  NotificationSettings: undefined;
  EditProfile: undefined;
  UpdateIdDocument: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  HelpCenter: undefined;
  ContactUs: undefined;
};

export type TabParamList = {
  Home: undefined;
  MyEvents: undefined;
  Profile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
