import { useEffect, useRef } from 'react';
import { POSLayout } from '@/components/pos/POSLayout';
import { usePOSSessionStore } from '@/stores/pos/posSessionStore';

export function POS() {
  const { activeSessionId, activeSessions, createSession, setActiveSession } = usePOSSessionStore();
  const hasCreatedInitialSession = useRef(false);

  useEffect(() => {
    // Create an initial session if none exist and we haven't created one yet
    if (activeSessions.length === 0 && !hasCreatedInitialSession.current) {
      hasCreatedInitialSession.current = true;
      const sessionId = createSession({ name: 'Session 1' });
      setActiveSession(sessionId);
    }
  }, [activeSessions.length, createSession, setActiveSession]);

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