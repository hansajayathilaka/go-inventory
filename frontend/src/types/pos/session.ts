// POS Session Types
export type SessionStatus = 'active' | 'on-hold' | 'completed';

export interface POSSession {
  id: string;
  name: string;
  status: SessionStatus;
  customerId?: string;
  customerName?: string;
  createdAt: Date;
  updatedAt: Date;
  itemCount: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
}

export interface SessionSummary {
  id: string;
  name: string;
  status: SessionStatus;
  itemCount: number;
  total: number;
}

export interface CreateSessionParams {
  name?: string;
  customerId?: string;
  customerName?: string;
}

export interface SessionActions {
  createSession: (params?: CreateSessionParams) => string;
  closeSession: (sessionId: string) => void;
  holdSession: (sessionId: string) => void;
  resumeSession: (sessionId: string) => void;
  updateSession: (sessionId: string, updates: Partial<POSSession>) => void;
  setActiveSession: (sessionId: string) => void;
  getSession: (sessionId: string) => POSSession | undefined;
  getAllSessions: () => POSSession[];
  getActiveSessions: () => POSSession[];
  clearCompletedSessions: () => void;
}