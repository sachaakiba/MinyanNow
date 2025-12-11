import React, { useEffect } from "react";
import { useNotifications } from "../hooks/useNotifications";

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const { expoPushToken, notification } = useNotifications();

  useEffect(() => {
    if (notification) {
      console.log("Received notification:", notification.request.content);
    }
  }, [notification]);

  return <>{children}</>;
};
