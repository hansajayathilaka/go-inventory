import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import type { CartItem } from './posCartStore'

export interface POSSession {
  id: string
  name: string
  customerId?: string
  customerName?: string
  cartItems: CartItem[]
  createdAt: Date
  lastActive: Date
  isActive: boolean
  subtotal: number
  tax: number
  discount: number
  total: number
}

interface POSSessionState {
  sessions: POSSession[]
  activeSessionId: string | null
  maxSessions: number

  createSession: (customerName?: string, customerId?: string) => string
  switchToSession: (sessionId: string) => void
  closeSession: (sessionId: string) => void
  updateSession: (sessionId: string, updates: Partial<POSSession>) => void
  updateSessionCart: (sessionId: string, cartItems: CartItem[], subtotal: number, tax: number, discount: number, total: number) => void
  setSessionCustomer: (sessionId: string, customerId?: string, customerName?: string) => void
  getSessionCustomer: (sessionId: string) => { id: string; name: string } | null
  getActiveSession: () => POSSession | null
  getSessionCount: () => number
  isMaxSessionsReached: () => boolean
  cleanupInactiveSessions: () => void
  clearAllSessions: () => void
}

const generateSessionId = (): string => {
  try {
    return crypto.randomUUID()
  } catch {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

const generateSessionName = (sessionNumber: number, customerName?: string): string => {
  if (customerName) {
    return customerName.length > 20 ? `${customerName.substring(0, 17)}...` : customerName
  }
  return `Session ${sessionNumber}`
}

// Removed - calculation now handled in cart store

export const usePOSSessionStore = create<POSSessionState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        sessions: [],
        activeSessionId: null,
        maxSessions: 5,

        createSession: (customerName?: string, customerId?: string) => {
          const state = get()
          
          if (state.sessions.length >= state.maxSessions) {
            throw new Error(`Maximum ${state.maxSessions} sessions allowed`)
          }

          const sessionId = generateSessionId()
          const sessionNumber = state.sessions.length + 1
          const name = generateSessionName(sessionNumber, customerName)
          const now = new Date()

          const newSession: POSSession = {
            id: sessionId,
            name,
            customerId,
            customerName,
            cartItems: [],
            createdAt: now,
            lastActive: now,
            isActive: true,
            subtotal: 0,
            tax: 0,
            discount: 0,
            total: 0
          }

          set((state) => ({
            sessions: [
              ...state.sessions.map(s => ({ ...s, isActive: false })),
              newSession
            ],
            activeSessionId: sessionId
          }))

          return sessionId
        },

        switchToSession: (sessionId: string) => {
          const state = get()
          const session = state.sessions.find(s => s.id === sessionId)
          
          if (!session) {
            console.warn(`Session ${sessionId} not found`)
            return
          }

          set((state) => ({
            sessions: state.sessions.map(s => ({
              ...s,
              isActive: s.id === sessionId,
              lastActive: s.id === sessionId ? new Date() : s.lastActive
            })),
            activeSessionId: sessionId
          }))
        },

        closeSession: (sessionId: string) => {
          const state = get()
          
          if (state.sessions.length <= 1) {
            return
          }

          const sessionIndex = state.sessions.findIndex(s => s.id === sessionId)
          if (sessionIndex === -1) return

          const isActiveSession = state.activeSessionId === sessionId
          const remainingSessions = state.sessions.filter(s => s.id !== sessionId)
          
          let newActiveSessionId = state.activeSessionId
          
          if (isActiveSession && remainingSessions.length > 0) {
            const nextSession = remainingSessions[Math.max(0, sessionIndex - 1)]
            newActiveSessionId = nextSession.id
          }

          set(() => ({
            sessions: remainingSessions.map(s => ({
              ...s,
              isActive: s.id === newActiveSessionId
            })),
            activeSessionId: newActiveSessionId
          }))
        },

        updateSession: (sessionId: string, updates: Partial<POSSession>) => {
          set((state) => ({
            sessions: state.sessions.map(s => 
              s.id === sessionId 
                ? { 
                    ...s, 
                    ...updates, 
                    lastActive: new Date() 
                  }
                : s
            )
          }))
        },

        // Update session customer
        setSessionCustomer: (sessionId: string, customerId?: string, customerName?: string) => {
          set((state) => ({
            sessions: state.sessions.map(s => 
              s.id === sessionId 
                ? { 
                    ...s, 
                    customerId,
                    customerName,
                    name: customerName || s.name,
                    lastActive: new Date() 
                  }
                : s
            )
          }))
        },

        // Get session customer
        getSessionCustomer: (sessionId: string) => {
          const state = get()
          const session = state.sessions.find(s => s.id === sessionId)
          if (session && session.customerId) {
            return {
              id: session.customerId,
              name: session.customerName || 'Unknown Customer'
            }
          }
          return null
        },

        updateSessionCart: (sessionId: string, cartItems: CartItem[], subtotal: number, tax: number, discount: number, total: number) => {
          set((state) => ({
            sessions: state.sessions.map(s => 
              s.id === sessionId 
                ? { 
                    ...s, 
                    cartItems: [...cartItems],
                    subtotal,
                    tax,
                    discount,
                    total,
                    lastActive: new Date()
                  }
                : s
            )
          }))
        },

        getActiveSession: () => {
          const state = get()
          return state.sessions.find(s => s.id === state.activeSessionId) || null
        },

        getSessionCount: () => {
          return get().sessions.length
        },

        isMaxSessionsReached: () => {
          const state = get()
          return state.sessions.length >= state.maxSessions
        },

        cleanupInactiveSessions: () => {
          const now = new Date()
          const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

          set(() => {
            const sessions = get().sessions
            const activeSessions = sessions.filter(s => 
              s.isActive || s.lastActive > oneHourAgo || s.cartItems.length > 0
            )

            return {
              sessions: activeSessions,
              activeSessionId: activeSessions.find(s => s.isActive)?.id || 
                              (activeSessions.length > 0 ? activeSessions[0].id : null)
            }
          })
        },

        clearAllSessions: () => {
          set(() => ({
            sessions: [],
            activeSessionId: null
          }))
        }
      }),
      {
        name: 'pos-sessions',
        partialize: (state) => ({
          sessions: state.sessions,
          activeSessionId: state.activeSessionId
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.sessions = state.sessions.map(s => ({
              ...s,
              createdAt: new Date(s.createdAt),
              lastActive: new Date(s.lastActive)
            }))
            
            if (state.sessions.length === 0) {
              const sessionId = state.createSession('Default Session')
              state.activeSessionId = sessionId
            } else if (!state.activeSessionId || !state.sessions.find(s => s.id === state.activeSessionId)) {
              state.activeSessionId = state.sessions[0].id
              state.sessions = state.sessions.map(s => ({
                ...s,
                isActive: s.id === state.sessions[0].id
              }))
            }
          }
        }
      }
    )
  )
)

export const initializePOSSession = () => {
  const store = usePOSSessionStore.getState()
  
  if (store.sessions.length === 0) {
    store.createSession('Default Session')
  }
  
  const cleanup = () => store.cleanupInactiveSessions()
  const interval = setInterval(cleanup, 10 * 60 * 1000)
  
  return () => clearInterval(interval)
}