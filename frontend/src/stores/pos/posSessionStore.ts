import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { POSSession, SessionStatus, CreateSessionParams, SessionActions } from '@/types/pos/session';

interface POSSessionState {
  sessions: Record<string, POSSession>;
  activeSessionId: string | null;
  nextSessionNumber: number;
}

interface POSSessionStore extends POSSessionState, SessionActions {
  // Additional computed properties
  activeSession: POSSession | null;
  activeSessions: POSSession[];
}

const generateSessionId = (): string => {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const generateSessionName = (sessionNumber: number): string => {
  return `Session ${sessionNumber}`;
};

export const usePOSSessionStore = create<POSSessionStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        sessions: {},
        activeSessionId: null,
        nextSessionNumber: 1,

        // Computed properties
        get activeSession() {
          const { sessions, activeSessionId } = get();
          return activeSessionId ? sessions[activeSessionId] || null : null;
        },

        get activeSessions() {
          const { sessions } = get();
          return Object.values(sessions).filter(session => session.status !== 'completed');
        },

        // Actions
        createSession: (params?: CreateSessionParams) => {
          const state = get();
          const sessionId = generateSessionId();
          const sessionName = params?.name || generateSessionName(state.nextSessionNumber);

          const newSession: POSSession = {
            id: sessionId,
            name: sessionName,
            status: 'active' as SessionStatus,
            customerId: params?.customerId,
            customerName: params?.customerName,
            createdAt: new Date(),
            updatedAt: new Date(),
            itemCount: 0,
            subtotal: 0,
            taxAmount: 0,
            discountAmount: 0,
            total: 0,
          };

          set((state) => ({
            sessions: {
              ...state.sessions,
              [sessionId]: newSession,
            },
            activeSessionId: sessionId,
            nextSessionNumber: state.nextSessionNumber + 1,
          }));

          return sessionId;
        },

        closeSession: (sessionId: string) => {
          set((state) => {
            const session = state.sessions[sessionId];
            if (!session) return state;

            const updatedSessions = {
              ...state.sessions,
              [sessionId]: {
                ...session,
                status: 'completed' as SessionStatus,
                updatedAt: new Date(),
              },
            };

            // If closing the active session, switch to another active session
            let newActiveSessionId = state.activeSessionId;
            if (state.activeSessionId === sessionId) {
              const remainingActiveSessions = Object.values(updatedSessions)
                .filter(s => s.status !== 'completed');
              newActiveSessionId = remainingActiveSessions.length > 0
                ? remainingActiveSessions[0].id
                : null;
            }

            return {
              sessions: updatedSessions,
              activeSessionId: newActiveSessionId,
            };
          });
        },

        holdSession: (sessionId: string) => {
          set((state) => {
            const session = state.sessions[sessionId];
            if (!session || session.status === 'completed') return state;

            return {
              sessions: {
                ...state.sessions,
                [sessionId]: {
                  ...session,
                  status: 'on-hold' as SessionStatus,
                  updatedAt: new Date(),
                },
              },
            };
          });
        },

        resumeSession: (sessionId: string) => {
          set((state) => {
            const session = state.sessions[sessionId];
            if (!session || session.status === 'completed') return state;

            return {
              sessions: {
                ...state.sessions,
                [sessionId]: {
                  ...session,
                  status: 'active' as SessionStatus,
                  updatedAt: new Date(),
                },
              },
            };
          });
        },

        updateSession: (sessionId: string, updates: Partial<POSSession>) => {
          set((state) => {
            const session = state.sessions[sessionId];
            if (!session) return state;

            return {
              sessions: {
                ...state.sessions,
                [sessionId]: {
                  ...session,
                  ...updates,
                  updatedAt: new Date(),
                },
              },
            };
          });
        },

        setActiveSession: (sessionId: string) => {
          set((state) => {
            const session = state.sessions[sessionId];
            if (!session || session.status === 'completed') return state;

            return {
              activeSessionId: sessionId,
            };
          });
        },

        getSession: (sessionId: string) => {
          return get().sessions[sessionId];
        },

        getAllSessions: () => {
          return Object.values(get().sessions);
        },

        getActiveSessions: () => {
          return Object.values(get().sessions).filter(session => session.status !== 'completed');
        },

        clearCompletedSessions: () => {
          set((state) => {
            const activeSessions = Object.fromEntries(
              Object.entries(state.sessions).filter(([, session]) => session.status !== 'completed')
            );

            return {
              sessions: activeSessions,
            };
          });
        },
      }),
      {
        name: 'pos-session-store',
        partialize: (state) => ({
          sessions: state.sessions,
          activeSessionId: state.activeSessionId,
          nextSessionNumber: state.nextSessionNumber,
        }),
      }
    ),
    {
      name: 'pos-session-store',
    }
  )
);