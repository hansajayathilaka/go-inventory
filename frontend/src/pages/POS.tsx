import { useState } from 'react';
import { POSLayout } from '@/components/pos/POSLayout';

export function POS() {
  const [activeSession, setActiveSession] = useState('session-1');

  return (
    <POSLayout
      activeSession={activeSession}
      onSessionChange={setActiveSession}
    />
  );
}