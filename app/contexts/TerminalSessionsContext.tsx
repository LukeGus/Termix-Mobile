import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { SSHHost } from '@/types';
import { router } from 'expo-router';

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
}

const TerminalSessionsContext = createContext<TerminalSessionsContextType | undefined>(undefined);

export const useTerminalSessions = () => {
  const context = useContext(TerminalSessionsContext);
  if (context === undefined) {
    throw new Error('useTerminalSessions must be used within a TerminalSessionsProvider');
  }
  return context;
};

interface TerminalSessionsProviderProps {
  children: ReactNode;
}

export const TerminalSessionsProvider: React.FC<TerminalSessionsProviderProps> = ({ children }) => {
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const addSession = useCallback((host: SSHHost): string => {
    const sessionId = `${host.id}-${Date.now()}`;
    const newSession: TerminalSession = {
      id: sessionId,
      host,
      title: host.name,
      isActive: true,
      createdAt: new Date(),
    };

    setSessions(prev => {
      // Deactivate all other sessions
      const updatedSessions = prev.map(session => ({
        ...session,
        isActive: false,
      }));
      
      // Add new session
      return [...updatedSessions, newSession];
    });

    setActiveSessionId(sessionId);
    return sessionId;
  }, []);

  const removeSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const updatedSessions = prev.filter(session => session.id !== sessionId);
      
      // If we're removing the active session, set a new active one
      if (activeSessionId === sessionId) {
        if (updatedSessions.length > 0) {
          const newActiveSession = updatedSessions[updatedSessions.length - 1];
          setActiveSessionId(newActiveSession.id);
          // Update the new active session
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
  }, [activeSessionId]);

  const setActiveSession = useCallback((sessionId: string) => {
    setSessions(prev => 
      prev.map(session => ({
        ...session,
        isActive: session.id === sessionId,
      }))
    );
    setActiveSessionId(sessionId);
  }, []);

  const navigateToSessions = useCallback((host?: SSHHost) => {
    if (host) {
      addSession(host);
    }
    router.push('/(tabs)/sessions');
  }, [addSession]);

  return (
    <TerminalSessionsContext.Provider
      value={{
        sessions,
        activeSessionId,
        addSession,
        removeSession,
        setActiveSession,
        navigateToSessions,
      }}
    >
      {children}
    </TerminalSessionsContext.Provider>
  );
};
