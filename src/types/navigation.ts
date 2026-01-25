export type RootStackParamList = {
  PhoneAuth: undefined;
  OTPVerification: { phoneNumber: string };
  CompleteProfile: undefined;
  UploadId: undefined;
  UploadDocuments: undefined;
  MainTabs: undefined;
  CreateEvent: undefined;
  EditEvent: { eventId: string };
  EventDetail: { eventId: string };
  Settings: undefined;
  NotificationSettings: undefined;
  EditProfile: undefined;
  UpdateIdDocument: { documentType?: "id" | "ketouba" | "selfie" } | undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  HelpCenter: undefined;
  ContactUs: undefined;
  MyParticipations: undefined;
  AdminDashboard: undefined;
};

export type TabParamList = {
  Home: undefined;
  MyEvents: undefined;
  Profile: undefined;
  AdminDashboard: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}
