export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  Home: undefined;
  CreateEvent: undefined;
  EditEvent: { eventId: string };
  EventDetail: { eventId: string };
  Profile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
