import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { SSHHost } from "@/types";
import { router } from "expo-router";

export interface TerminalSession {
  id: string;
  host: SSHHost;
  title: string;
  isActive: boolean;
  createdAt: Date;
}

interface TerminalSessionsContextType {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  addSession: (host: SSHHost) => string;
  removeSession: (sessionId: string) => void;
  setActiveSession: (sessionId: string) => void;
  navigateToSessions: (host?: SSHHost) => void;
  isCustomKeyboardVisible: boolean;
  toggleCustomKeyboard: () => void;
  lastKeyboardHeight: number;
  setLastKeyboardHeight: (height: number) => void;
}

const TerminalSessionsContext = createContext<
  TerminalSessionsContextType | undefined
>(undefined);

export const useTerminalSessions = () => {
  const context = useContext(TerminalSessionsContext);
  if (context === undefined) {
    throw new Error(
      "useTerminalSessions must be used within a TerminalSessionsProvider",
    );
  }
  return context;
};

interface TerminalSessionsProviderProps {
  children: ReactNode;
}

export const TerminalSessionsProvider: React.FC<
  TerminalSessionsProviderProps
> = ({ children }) => {
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isCustomKeyboardVisible, setIsCustomKeyboardVisible] = useState(false);
  const [lastKeyboardHeight, setLastKeyboardHeight] = useState(300);

  const addSession = useCallback((host: SSHHost): string => {
    setSessions((prev) => {
      const existingSessions = prev.filter(
        (session) => session.host.id === host.id,
      );

      let title = host.name;
      if (existingSessions.length > 0) {
        title = `${host.name} (${existingSessions.length + 1})`;
      }

      const sessionId = `${host.id}-${Date.now()}`;
      const newSession: TerminalSession = {
        id: sessionId,
        host,
        title,
        isActive: true,
        createdAt: new Date(),
      };

      const updatedSessions = prev.map((session) => ({
        ...session,
        isActive: false,
      }));

      setActiveSessionId(sessionId);
      return [...updatedSessions, newSession];
    });

    return "";
  }, []);

  const removeSession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => {
        const sessionToRemove = prev.find(
          (session) => session.id === sessionId,
        );
        if (!sessionToRemove) return prev;

        const updatedSessions = prev.filter(
          (session) => session.id !== sessionId,
        );

        const hostId = sessionToRemove.host.id;
        const sameHostSessions = updatedSessions.filter(
          (session) => session.host.id === hostId,
        );

        if (sameHostSessions.length > 0) {
          sameHostSessions.sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
          );

          sameHostSessions.forEach((session, index) => {
            const sessionIndex = updatedSessions.findIndex(
              (s) => s.id === session.id,
            );
            if (sessionIndex !== -1) {
              updatedSessions[sessionIndex] = {
                ...session,
                title:
                  index === 0
                    ? session.host.name
                    : `${session.host.name} (${index + 1})`,
              };
            }
          });
        }

        if (activeSessionId === sessionId) {
          if (updatedSessions.length > 0) {
            const newActiveSession =
              updatedSessions[updatedSessions.length - 1];
            setActiveSessionId(newActiveSession.id);
            updatedSessions[updatedSessions.length - 1] = {
              ...newActiveSession,
              isActive: true,
            };
          } else {
            setActiveSessionId(null);
          }
        }

        return updatedSessions;
      });
    },
    [activeSessionId],
  );

  const setActiveSession = useCallback((sessionId: string) => {
    setSessions((prev) =>
      prev.map((session) => ({
        ...session,
        isActive: session.id === sessionId,
      })),
    );
    setActiveSessionId(sessionId);
  }, []);

  const navigateToSessions = useCallback(
    (host?: SSHHost) => {
      if (host) {
        addSession(host);
      }
      router.push("/(tabs)/sessions");
    },
    [addSession],
  );

  const toggleCustomKeyboard = useCallback(() => {
    setIsCustomKeyboardVisible((prev) => !prev);
  }, []);

  return (
    <TerminalSessionsContext.Provider
      value={{
        sessions,
        activeSessionId,
        addSession,
        removeSession,
        setActiveSession,
        navigateToSessions,
        isCustomKeyboardVisible,
        toggleCustomKeyboard,
        lastKeyboardHeight,
        setLastKeyboardHeight,
      }}
    >
      {children}
    </TerminalSessionsContext.Provider>
  );
};
