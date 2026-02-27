import React, { useEffect } from "react";
import { useNotifications } from "../hooks/useNotifications";
import { usePendingRequests } from "../context/PendingRequestsContext";

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const { expoPushToken, notification } = useNotifications();
  const { refreshPendingCount } = usePendingRequests();

  useEffect(() => {
    if (notification) {
      console.log("Received notification:", notification.request.content);
      refreshPendingCount();
    }
  }, [notification, refreshPendingCount]);

  return <>{children}</>;
};
