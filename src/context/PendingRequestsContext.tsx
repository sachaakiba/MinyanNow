import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuth } from "./AuthContext";
import { eventsApi } from "../lib/api";

const POLL_INTERVAL_MS = 30_000;

interface PendingRequestsContextType {
  pendingCount: number;
  refreshPendingCount: () => Promise<void>;
}

const PendingRequestsContext = createContext<PendingRequestsContextType>({
  pendingCount: 0,
  refreshPendingCount: async () => {},
});

export const usePendingRequests = () => useContext(PendingRequestsContext);

export const PendingRequestsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const appState = useRef(AppState.currentState);

  const refreshPendingCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const events = await eventsApi.getMyEvents();
      const total = events.reduce(
        (acc, e) => acc + (e._count?.requests || 0),
        0
      );
      setPendingCount(total);
    } catch {
      // Silently fail — user may not be authenticated yet
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setPendingCount(0);
      return;
    }

    refreshPendingCount();

    const interval = setInterval(refreshPendingCount, POLL_INTERVAL_MS);

    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          refreshPendingCount();
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [isAuthenticated, refreshPendingCount]);

  return (
    <PendingRequestsContext.Provider
      value={{ pendingCount, refreshPendingCount }}
    >
      {children}
    </PendingRequestsContext.Provider>
  );
};
