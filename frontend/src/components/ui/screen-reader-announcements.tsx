import { useEffect, useRef, useState } from 'react'

interface ScreenReaderAnnouncementProps {
  message: string
  priority?: 'polite' | 'assertive' | 'off'
  onAnnounced?: () => void
}

// Screen reader announcement component for accessibility
export function ScreenReaderAnnouncement({ 
  message, 
  priority = 'polite',
  onAnnounced 
}: ScreenReaderAnnouncementProps) {
  const announcementRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (message && announcementRef.current) {
      announcementRef.current.textContent = message
      onAnnounced?.()
      
      // Clear message after announcement
      const timer = setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = ''
        }
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [message, onAnnounced])

  return (
    <div
      ref={announcementRef}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      role="status"
    />
  )
}

// Global announcements hook for keyboard shortcuts and actions
export function useScreenReaderAnnouncements() {
  const [currentAnnouncement, setCurrentAnnouncement] = useState('')
  const [priority, setPriority] = useState<'polite' | 'assertive' | 'off'>('polite')

  const announce = (message: string, announcementPriority: 'polite' | 'assertive' | 'off' = 'polite') => {
    setPriority(announcementPriority)
    setCurrentAnnouncement(message)
  }

  const announceShortcut = (shortcut: string, action: string) => {
    announce(`Keyboard shortcut ${shortcut} activated: ${action}`, 'assertive')
  }

  const announceNavigation = (from: string, to: string) => {
    announce(`Navigated from ${from} to ${to}`, 'polite')
  }

  const announceProductAdded = (productName: string, quantity: number) => {
    announce(`Added ${quantity} ${productName} to cart`, 'polite')
  }

  const announceCartUpdate = (action: string, productName: string, newQuantity?: number) => {
    const message = newQuantity 
      ? `${action} ${productName}. New quantity: ${newQuantity}`
      : `${action} ${productName}`
    announce(message, 'polite')
  }

  const announcePaymentStatus = (status: string, amount?: number) => {
    const message = amount 
      ? `Payment ${status}. Amount: $${amount.toFixed(2)}`
      : `Payment ${status}`
    announce(message, 'assertive')
  }

  const handleAnnounced = () => {
    setCurrentAnnouncement('')
  }

  return {
    announce,
    announceShortcut,
    announceNavigation,
    announceProductAdded,
    announceCartUpdate,
    announcePaymentStatus,
    ScreenReaderComponent: (
      <ScreenReaderAnnouncement 
        message={currentAnnouncement}
        priority={priority}
        onAnnounced={handleAnnounced}
      />
    )
  }
}

// Keyboard shortcuts status component for screen readers
interface KeyboardShortcutsStatusProps {
  currentContext: string
  availableShortcuts: Array<{
    key: string
    description: string
    enabled: boolean
  }>
}

export function KeyboardShortcutsStatus({ 
  currentContext, 
  availableShortcuts 
}: KeyboardShortcutsStatusProps) {
  const enabledShortcuts = availableShortcuts.filter(s => s.enabled)
  
  return (
    <div className="sr-only" aria-live="polite" role="region" aria-label="Keyboard shortcuts status">
      <div>{currentContext} context active</div>
      <div>
        Available shortcuts: {enabledShortcuts.length === 0 ? 'None' : 
          enabledShortcuts.map(s => `${s.key} for ${s.description}`).join(', ')
        }
      </div>
    </div>
  )
}

// Focus management utilities for accessibility
export const AccessibilityUtils = {
  // Announce when focus moves to a new element
  announceFocusChange: (elementDescription: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = `Focus moved to ${elementDescription}`
    
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  },

  // Set up proper focus indicators
  setupFocusIndicators: () => {
    const style = document.createElement('style')
    style.textContent = `
      .focus-visible:focus {
        outline: 2px solid #2563eb !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1) !important;
      }
      
      .focus-visible:focus:not(:focus-visible) {
        outline: none !important;
        box-shadow: none !important;
      }
    `
    document.head.appendChild(style)
  },

  // Ensure proper heading hierarchy
  validateHeadingHierarchy: () => {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
    let currentLevel = 0
    let hasIssues = false
    
    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1))
      if (level > currentLevel + 1) {
        console.warn(`Heading hierarchy issue: ${heading.tagName} follows h${currentLevel}`)
        hasIssues = true
      }
      currentLevel = level
    })
    
    return !hasIssues
  },

  // Add keyboard navigation hints
  addKeyboardHints: (element: HTMLElement, shortcuts: string[]) => {
    element.setAttribute('aria-keyshortcuts', shortcuts.join(' '))
    element.setAttribute('title', `Keyboard shortcuts: ${shortcuts.join(', ')}`)
  },

  // Ensure proper labeling for form controls
  ensureFormLabeling: () => {
    const inputs = document.querySelectorAll('input, select, textarea')
    let unlabeledCount = 0
    
    inputs.forEach((input) => {
      const hasLabel = input.getAttribute('aria-label') || 
                     input.getAttribute('aria-labelledby') ||
                     document.querySelector(`label[for="${input.id}"]`)
      
      if (!hasLabel) {
        console.warn('Unlabeled form control found:', input)
        unlabeledCount++
      }
    })
    
    return unlabeledCount === 0
  }
}

// High contrast mode detection and support
export function useHighContrastMode() {
  const [isHighContrast, setIsHighContrast] = useState(false)

  useEffect(() => {
    const checkHighContrast = () => {
      // Check for Windows high contrast mode
      if (window.matchMedia) {
        const highContrastQuery = window.matchMedia('(prefers-contrast: high)')
        setIsHighContrast(highContrastQuery.matches)
        
        const handleChange = (e: MediaQueryListEvent) => {
          setIsHighContrast(e.matches)
        }
        
        highContrastQuery.addListener(handleChange)
        return () => highContrastQuery.removeListener(handleChange)
      }
    }

    checkHighContrast()
  }, [])

  return isHighContrast
}

// Reduced motion detection for accessibility
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  return prefersReducedMotion
}