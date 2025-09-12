import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface KeyboardShortcutBadgeProps {
  shortcut: string
  className?: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export function KeyboardShortcutBadge({ 
  shortcut, 
  className,
  variant = 'secondary',
  size = 'sm'
}: KeyboardShortcutBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 h-5',
    md: 'text-sm px-2 py-1 h-6', 
    lg: 'text-sm px-2.5 py-1.5 h-7'
  }

  return (
    <Badge 
      variant={variant}
      className={cn(
        'font-mono font-medium inline-flex items-center justify-center min-w-fit',
        sizeClasses[size],
        className
      )}
      aria-label={`Keyboard shortcut: ${shortcut}`}
    >
      {shortcut}
    </Badge>
  )
}

interface ShortcutTooltipProps {
  shortcut: string
  description: string
  children: React.ReactNode
  className?: string
}

export function ShortcutTooltip({ 
  shortcut, 
  description, 
  children,
  className 
}: ShortcutTooltipProps) {
  return (
    <div 
      className={cn('relative group', className)}
      title={`${description} (${shortcut})`}
      aria-keyshortcuts={shortcut.toLowerCase()}
    >
      {children}
      
      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        {description}
        <br />
        <span className="font-mono text-gray-300">{shortcut}</span>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  )
}

interface ShortcutIndicatorProps {
  shortcut: string
  description: string
  enabled?: boolean
  className?: string
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export function ShortcutIndicator({ 
  shortcut, 
  description, 
  enabled = true,
  className,
  position = 'top-right'
}: ShortcutIndicatorProps) {
  const positionClasses = {
    'top-right': 'absolute top-1 right-1',
    'top-left': 'absolute top-1 left-1', 
    'bottom-right': 'absolute bottom-1 right-1',
    'bottom-left': 'absolute bottom-1 left-1'
  }

  if (!enabled) return null

  return (
    <div 
      className={cn(
        positionClasses[position],
        'pointer-events-none z-10',
        className
      )}
      title={`${description} (${shortcut})`}
      aria-label={`Keyboard shortcut: ${shortcut} - ${description}`}
    >
      <KeyboardShortcutBadge 
        shortcut={shortcut}
        variant={enabled ? 'secondary' : 'outline'}
        className={cn(
          'shadow-sm',
          !enabled && 'opacity-50'
        )}
      />
    </div>
  )
}

interface ShortcutHelpProps {
  shortcuts: Array<{
    key: string
    description: string
    enabled?: boolean
  }>
  title?: string
  className?: string
  compact?: boolean
}

export function ShortcutHelp({ 
  shortcuts, 
  title = 'Keyboard Shortcuts',
  className,
  compact = false
}: ShortcutHelpProps) {
  const enabledShortcuts = shortcuts.filter(s => s.enabled !== false)
  
  if (enabledShortcuts.length === 0) return null

  return (
    <div className={cn(
      'bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-sm',
      className
    )}>
      {!compact && (
        <h4 className="font-medium text-sm mb-2">{title}</h4>
      )}
      
      <div className={cn(
        'space-y-1',
        compact && 'space-y-0.5'
      )}>
        {enabledShortcuts.map((shortcut, index) => (
          <div 
            key={index}
            className="flex items-center justify-between gap-2 text-xs"
          >
            <span className="text-muted-foreground truncate">
              {shortcut.description}
            </span>
            <KeyboardShortcutBadge 
              shortcut={shortcut.key}
              size={compact ? 'sm' : 'md'}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Component for showing active shortcuts in corners/edges
interface FloatingShortcutsProps {
  shortcuts: Array<{
    key: string
    description: string
    enabled?: boolean
  }>
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  className?: string
}

export function FloatingShortcuts({
  shortcuts,
  position = 'bottom-right',
  className
}: FloatingShortcutsProps) {
  const enabledShortcuts = shortcuts.filter(s => s.enabled !== false)
  
  if (enabledShortcuts.length === 0) return null

  const positionClasses = {
    'top-right': 'fixed top-4 right-4',
    'top-left': 'fixed top-4 left-4',
    'bottom-right': 'fixed bottom-4 right-4', 
    'bottom-left': 'fixed bottom-4 left-4'
  }

  return (
    <div className={cn(
      positionClasses[position],
      'z-50 pointer-events-none',
      className
    )}>
      <ShortcutHelp
        shortcuts={enabledShortcuts}
        compact
        className="max-w-xs"
      />
    </div>
  )
}