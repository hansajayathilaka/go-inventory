import { useState, useEffect, useCallback } from 'react'
import { usePOSSessionStore } from '@/stores/posSessionStore'
import type { Customer } from '@/types/inventory'

interface SessionCustomer {
  id?: number
  name?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
}

export function useSessionCustomer() {
  const {
    activeSessionId,
    getActiveSession,
    setSessionCustomer,
    getSessionCustomer
  } = usePOSSessionStore()

  const [selectedCustomer, setSelectedCustomer] = useState<SessionCustomer | null>(null)

  // Load customer from active session
  useEffect(() => {
    if (activeSessionId) {
      const activeSession = getActiveSession()
      if (activeSession && activeSession.customerId) {
        setSelectedCustomer({
          id: activeSession.customerId,
          name: activeSession.customerName
        })
      } else {
        setSelectedCustomer(null)
      }
    }
  }, [activeSessionId, getActiveSession])

  // Select customer for current session
  const selectCustomer = useCallback((customer: Customer | null) => {
    if (!activeSessionId) return

    if (customer) {
      setSessionCustomer(activeSessionId, customer.id, customer.name)
      setSelectedCustomer({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        country: customer.country
      })
    } else {
      // Walk-in customer or no customer
      setSessionCustomer(activeSessionId, undefined, undefined)
      setSelectedCustomer(null)
    }
  }, [activeSessionId, setSessionCustomer])

  // Clear customer for current session
  const clearCustomer = useCallback(() => {
    if (!activeSessionId) return
    
    setSessionCustomer(activeSessionId, undefined, undefined)
    setSelectedCustomer(null)
  }, [activeSessionId, setSessionCustomer])

  // Check if current session has a customer
  const hasCustomer = useCallback(() => {
    if (!activeSessionId) return false
    const sessionCustomer = getSessionCustomer(activeSessionId)
    return !!sessionCustomer
  }, [activeSessionId, getSessionCustomer])

  // Get customer info for current session
  const getCustomerInfo = useCallback(() => {
    if (!activeSessionId) return null
    return getSessionCustomer(activeSessionId)
  }, [activeSessionId, getSessionCustomer])

  return {
    selectedCustomer,
    selectCustomer,
    clearCustomer,
    hasCustomer,
    getCustomerInfo,
    sessionId: activeSessionId
  }
}