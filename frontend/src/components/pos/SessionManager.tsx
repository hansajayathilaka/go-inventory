import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  X,
  Pause,
  Play,
  AlertCircle,
} from 'lucide-react';
import { usePOSSessionStore } from '@/stores/pos/posSessionStore';
import { usePOSCartStore } from '@/stores/pos/posCartStore';

interface SessionManagerProps {
  activeSessionId: string | null;
  onSessionChange: (sessionId: string) => void;
}

export function SessionManager({ activeSessionId, onSessionChange }: SessionManagerProps) {
  const {
    activeSessions,
    createSession,
    closeSession,
    holdSession,
    resumeSession,
    setActiveSession,
  } = usePOSSessionStore();

  const { getCartSummary } = usePOSCartStore();

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

  const handleToggleHold = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const session = activeSessions.find(s => s.id === sessionId);
    if (!session) return;

    if (session.status === 'on-hold') {
      resumeSession(sessionId);
    } else {
      holdSession(sessionId);
    }
  };

  const handleSessionClick = (sessionId: string) => {
    setActiveSession(sessionId);
    onSessionChange(sessionId);
  };

  if (activeSessions.length === 0) {
    return (
      <div className="flex items-center justify-between px-6 py-2">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-semibold">Point of Sale</h1>
          <Badge variant="secondary">Multi-Session POS</Badge>
        </div>
        <Button
          size="sm"
          onClick={handleNewSession}
          className="flex items-center space-x-1"
        >
          <Plus className="h-4 w-4" />
          <span>Start New Session</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-6 py-2">
      <div className="flex items-center space-x-2">
        <h1 className="text-xl font-semibold">Point of Sale</h1>
        <Badge variant="secondary">Multi-Session POS</Badge>
      </div>

      <Tabs
        value={activeSessionId || ''}
        onValueChange={handleSessionClick}
        className="flex-1 max-w-4xl mx-4"
      >
        <div className="flex items-center space-x-2">
          <TabsList className="grid w-full grid-cols-fit">
            {activeSessions.map((session) => {
              const summary = getCartSummary(session.id);
              return (
                <TabsTrigger
                  key={session.id}
                  value={session.id}
                  className="relative group min-w-[120px]"
                >
                  <div className="flex items-center space-x-2">
                    <span className="truncate max-w-20">{session.name}</span>

                    {/* Session Status Indicators */}
                    {session.status === 'on-hold' && (
                      <Pause className="h-3 w-3 text-orange-500" />
                    )}

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
                  </div>

                  {/* Session Action Buttons */}
                  <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0 hover:bg-secondary"
                        onClick={(e) => handleToggleHold(session.id, e)}
                        title={session.status === 'on-hold' ? 'Resume Session' : 'Hold Session'}
                      >
                        {session.status === 'on-hold' ? (
                          <Play className="h-3 w-3" />
                        ) : (
                          <Pause className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={(e) => handleCloseSession(session.id, e)}
                        title="Close Session"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>

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
      </Tabs>

      {/* Session Summary Info */}
      {activeSessionId && (
        <div className="text-sm text-muted-foreground">
          {activeSessions.length} session{activeSessions.length !== 1 ? 's' : ''} active
        </div>
      )}
    </div>
  );
}