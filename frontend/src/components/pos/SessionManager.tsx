import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  X,
  AlertCircle,
  History,
} from 'lucide-react';
import { usePOSSessionStore } from '@/stores/pos/posSessionStore';
import { usePOSCartStore } from '@/stores/pos/posCartStore';
import { TransactionHistory } from './Transaction/TransactionHistory';

interface SessionManagerProps {
  activeSessionId: string | null;
  onSessionChange: (sessionId: string) => void;
}

export function SessionManager({ activeSessionId, onSessionChange }: SessionManagerProps) {
  const {
    createSession,
    closeSession,
    setActiveSession,
    getActiveSessions,
  } = usePOSSessionStore();

  // Use the store method to get active sessions to ensure reactivity
  const activeSessionsList = getActiveSessions();

  const { getCartSummary } = usePOSCartStore();
  const [transactionHistoryOpen, setTransactionHistoryOpen] = useState(false);

  const handleNewSession = () => {
    const sessionId = createSession();
    onSessionChange(sessionId);
  };

  const handleCloseSession = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const summary = getCartSummary(sessionId);

    if (summary.itemCount > 0) {
      // TODO: Add confirmation dialog for sessions with items
      if (!confirm('This session has items. Are you sure you want to close it?')) {
        return;
      }
    }

    closeSession(sessionId);
  };


  const handleSessionClick = (sessionId: string) => {
    setActiveSession(sessionId);
    onSessionChange(sessionId);
  };

  if (activeSessionsList.length === 0) {
    return (
      <div className="flex items-center justify-between px-6 py-2">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-semibold">Point of Sale</h1>
          <Badge variant="secondary">Multi-Session POS</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setTransactionHistoryOpen(true)}
            title="View Transaction History"
          >
            <History className="h-4 w-4 mr-1" />
            History
          </Button>
          <Button
            size="sm"
            onClick={handleNewSession}
            className="flex items-center space-x-1"
          >
            <Plus className="h-4 w-4" />
            <span>Start New Session</span>
          </Button>
        </div>

        {/* Transaction History Dialog */}
        <TransactionHistory
          open={transactionHistoryOpen}
          onOpenChange={setTransactionHistoryOpen}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-6 py-2">
      <div className="flex items-center space-x-2">
        <h1 className="text-xl font-semibold">Point of Sale</h1>
        <Badge variant="secondary">Multi-Session POS</Badge>
      </div>

      <div className="flex-1 max-w-4xl mx-4">
        <div className="flex items-center space-x-2">
          <div className="flex bg-muted p-1 rounded-md">
            {activeSessionsList.map((session) => {
              const summary = getCartSummary(session.id);
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  className={`relative min-w-[140px] px-3 py-1.5 text-sm font-medium rounded-sm transition-colors border flex items-center justify-between ${
                    isActive
                      ? 'bg-background text-foreground shadow-sm border-border'
                      : 'bg-muted/20 text-muted-foreground hover:bg-background/50 hover:text-foreground border-transparent'
                  }`}
                >
                  <button
                    onClick={() => handleSessionClick(session.id)}
                    className="flex items-center space-x-2 flex-1"
                  >
                    <span className="truncate max-w-16">{session.name}</span>

                    {/* Item Count Badge */}
                    {summary.itemCount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {summary.itemCount}
                      </Badge>
                    )}

                    {/* Warning for sessions with issues */}
                    {summary.total < 0 && (
                      <AlertCircle className="h-3 w-3 text-destructive" />
                    )}
                  </button>

                  {/* Close Button - Separate button element */}
                  <button
                    className="h-4 w-4 p-0 ml-2 rounded hover:bg-destructive hover:text-destructive-foreground opacity-60 hover:opacity-100 transition-colors flex items-center justify-center"
                    onClick={(e) => handleCloseSession(session.id, e)}
                    title="Close Session"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleNewSession}
            className="flex items-center space-x-1"
          >
            <Plus className="h-4 w-4" />
            <span>New Session</span>
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setTransactionHistoryOpen(true)}
          title="View Transaction History"
        >
          <History className="h-4 w-4 mr-1" />
          History
        </Button>

        {/* Session Summary Info */}
        {activeSessionId && (
          <div className="text-sm text-muted-foreground">
            {activeSessionsList.length} session{activeSessionsList.length !== 1 ? 's' : ''} active
          </div>
        )}
      </div>

      {/* Transaction History Dialog */}
      <TransactionHistory
        open={transactionHistoryOpen}
        onOpenChange={setTransactionHistoryOpen}
      />
    </div>
  );
}