import { useEffect } from 'react';
import { POSLayout } from '@/components/pos/POSLayout';
import { usePOSSessionStore } from '@/stores/pos/posSessionStore';

export function POS() {
  const { activeSessionId, activeSessions, createSession, setActiveSession } = usePOSSessionStore();

  useEffect(() => {
    // Create an initial session if none exist
    if (activeSessions.length === 0) {
      createSession({ name: 'Session 1' });
    }
  }, [activeSessions.length, createSession]);

  const handleSessionChange = (sessionId: string) => {
    setActiveSession(sessionId);
  };

  return (
    <POSLayout
      activeSession={activeSessionId}
      onSessionChange={handleSessionChange}
    />
  );
}