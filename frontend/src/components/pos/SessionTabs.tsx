import { useState } from 'react'
import { Plus, X, Settings, Users, ShoppingCart, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePOSSessionStore, type POSSession } from '@/stores/posSessionStore'
import { cn } from '@/lib/utils'

interface SessionTabsProps {
  className?: string
  onSessionChange?: (sessionId: string) => void
}

export function SessionTabs({ className, onSessionChange }: SessionTabsProps) {
  const {
    sessions,
    activeSessionId,
    createSession,
    switchToSession,
    closeSession,
    updateSession,
    isMaxSessionsReached,
    getSessionCount
  } = usePOSSessionStore()

  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [closingSessionId, setClosingSessionId] = useState<string | null>(null)
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null)
  const [newSessionName, setNewSessionName] = useState('')

  const handleCreateSession = () => {
    if (!isMaxSessionsReached()) {
      const sessionId = createSession()
      onSessionChange?.(sessionId)
    }
  }

  const handleSwitchSession = (sessionId: string) => {
    if (sessionId !== activeSessionId) {
      switchToSession(sessionId)
      onSessionChange?.(sessionId)
    }
  }

  const handleCloseSessionRequest = (sessionId: string) => {
    if (sessions.length <= 1) return
    
    setClosingSessionId(sessionId)
    setShowCloseDialog(true)
  }

  const confirmCloseSession = () => {
    if (!closingSessionId) return
    
    const wasActive = closingSessionId === activeSessionId
    closeSession(closingSessionId)
    
    if (wasActive && sessions.length > 1) {
      const remainingSessions = sessions.filter(s => s.id !== closingSessionId)
      const nextSession = remainingSessions[0]
      if (nextSession) {
        onSessionChange?.(nextSession.id)
      }
    }
    
    setShowCloseDialog(false)
    setClosingSessionId(null)
  }

  const handleRenameSession = (sessionId: string, currentName: string) => {
    setRenamingSessionId(sessionId)
    setNewSessionName(currentName)
    setShowRenameDialog(true)
  }

  const confirmRename = () => {
    if (renamingSessionId && newSessionName.trim()) {
      updateSession(renamingSessionId, { name: newSessionName.trim() })
    }
    setShowRenameDialog(false)
    setRenamingSessionId(null)
    setNewSessionName('')
  }

  const formatSessionTime = (date: Date) => {
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    return date.toLocaleDateString()
  }

  const getSessionIcon = (session: POSSession) => {
    if (session.customerId) return Users
    if (session.cartItems.length > 0) return ShoppingCart
    return Clock
  }

  return (
    <div className={cn("w-full", className)}>
      <Card className="border-b rounded-none">
        <CardContent className="p-2">
          <div className="flex items-center gap-2">
            <ScrollArea className="flex-1">
              <div className="flex items-center gap-2 min-w-0">
                {sessions.map((session) => {
                  const isActive = session.id === activeSessionId
                  const hasItems = session.cartItems.length > 0
                  const SessionIcon = getSessionIcon(session)
                  
                  return (
                    <div
                      key={session.id}
                      className="flex items-center shrink-0"
                    >
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className={cn(
                          "h-12 px-3 py-2 gap-2 min-w-[120px] max-w-[200px] justify-start relative",
                          isActive && "bg-primary text-primary-foreground shadow-sm",
                          !isActive && hasItems && "ring-1 ring-orange-200 bg-orange-50"
                        )}
                        onClick={() => handleSwitchSession(session.id)}
                      >
                        <SessionIcon className="h-4 w-4 shrink-0" />
                        <div className="flex-1 text-left truncate">
                          <div className="font-medium text-sm truncate">
                            {session.name}
                          </div>
                          {session.customerName && (
                            <div className="text-xs opacity-75 truncate">
                              {session.customerName}
                            </div>
                          )}
                        </div>
                        {hasItems && (
                          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                            {session.cartItems.length}
                          </Badge>
                        )}
                      </Button>

                      {sessions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 ml-1 text-muted-foreground hover:text-destructive"
                          onClick={() => handleCloseSessionRequest(session.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateSession}
                disabled={isMaxSessionsReached()}
                className="gap-2"
                title={isMaxSessionsReached() ? "Maximum sessions reached" : "Create new session"}
              >
                <Plus className="h-4 w-4" />
                New Session
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="p-2">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <div className="text-sm font-medium">Session Management</div>
                    <div className="text-xs text-muted-foreground">
                      {getSessionCount()} of 5 sessions
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  
                  {sessions.map((session) => {
                    const isActive = session.id === activeSessionId
                    return (
                      <DropdownMenuItem
                        key={session.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className={cn(
                              "w-2 h-2 rounded-full",
                              isActive ? "bg-green-500" : "bg-gray-300"
                            )}
                          />
                          <div>
                            <div className="text-sm font-medium">{session.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatSessionTime(session.lastActive)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {session.cartItems.length > 0 && (
                            <Badge variant="outline" className="h-5 px-1.5 text-xs">
                              {session.cartItems.length}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRenameSession(session.id, session.name)
                            }}
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                        </div>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Session</DialogTitle>
            <DialogDescription>
              Enter a new name for this session.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="session-name" className="text-sm font-medium">
              Session Name
            </Label>
            <Input
              id="session-name"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              className="mt-2"
              placeholder="Enter session name..."
              maxLength={50}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmRename}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Session</DialogTitle>
            <DialogDescription>
              {closingSessionId && (() => {
                const session = sessions.find(s => s.id === closingSessionId);
                const hasItems = session && session.cartItems.length > 0;
                return hasItems 
                  ? `This session has ${session.cartItems.length} item(s) in the cart. Are you sure you want to close it? All items will be lost.`
                  : `Are you sure you want to close "${session?.name}"?`;
              })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmCloseSession}
            >
              Close Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}