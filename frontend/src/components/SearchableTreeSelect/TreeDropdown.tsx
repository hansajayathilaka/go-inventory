import React, { useEffect, useCallback, useRef, useState } from 'react';
import type { TreeDropdownProps } from './types';

const TreeDropdown: React.FC<TreeDropdownProps> = ({
  isOpen,
  onClose,
  children,
  triggerRef,
  maxHeight,
  className = '',
  placement = 'auto',
  offset = 4
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0
  });
  const [actualPlacement, setActualPlacement] = useState<'top' | 'bottom'>('bottom');
  
  // Calculate dropdown position
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !dropdownRef.current) return;
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    const spaceBelow = viewportHeight - triggerRect.bottom - offset;
    const spaceAbove = triggerRect.top - offset;
    
    let finalPlacement: 'top' | 'bottom' = 'bottom';
    
    if (placement === 'auto') {
      // Choose placement based on available space
      if (spaceBelow < maxHeight && spaceAbove > spaceBelow) {
        finalPlacement = 'top';
      } else {
        finalPlacement = 'bottom';
      }
    } else {
      finalPlacement = placement === 'top' ? 'top' : 'bottom';
    }
    
    let top: number;
    if (finalPlacement === 'top') {
      top = triggerRect.top - maxHeight - offset;
    } else {
      top = triggerRect.bottom + offset;
    }
    
    // Ensure dropdown doesn't go off-screen horizontally
    let left = triggerRect.left;
    const dropdownWidth = Math.max(triggerRect.width, 300); // Minimum width
    
    if (left + dropdownWidth > viewportWidth) {
      left = viewportWidth - dropdownWidth - 10;
    }
    
    if (left < 10) {
      left = 10;
    }
    
    setPosition({
      top: Math.max(10, top),
      left,
      width: dropdownWidth
    });
    
    setActualPlacement(finalPlacement);
  }, [triggerRef, maxHeight, placement, offset]);
  
  // Handle click outside to close dropdown
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      triggerRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      !triggerRef.current.contains(event.target as Node)
    ) {
      onClose();
    }
  }, [onClose, triggerRef]);
  
  // Handle escape key to close dropdown
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);
  
  // Handle scroll to reposition dropdown
  const handleScroll = useCallback(() => {
    if (isOpen) {
      calculatePosition();
    }
  }, [isOpen, calculatePosition]);
  
  // Handle window resize to reposition dropdown
  const handleResize = useCallback(() => {
    if (isOpen) {
      calculatePosition();
    }
  }, [isOpen, calculatePosition]);
  
  // Set up event listeners when dropdown is open
  useEffect(() => {
    if (isOpen) {
      calculatePosition();
      
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen, calculatePosition, handleClickOutside, handleKeyDown, handleScroll, handleResize]);
  
  // Recalculate position when dropdown content changes
  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(calculatePosition, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, children, calculatePosition]);
  
  if (!isOpen) {
    return null;
  }
  
  return (
    <>
      {/* Backdrop for mobile */}
      <div className="fixed inset-0 bg-black bg-opacity-25 z-40 sm:hidden" />
      
      {/* Dropdown */}
      <div
        ref={dropdownRef}
        className={`
          fixed z-50 bg-card text-card-foreground border border-border rounded-md shadow-lg
          ${actualPlacement === 'top' ? 'shadow-top' : 'shadow-bottom'}
          ${className}
        `}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
          maxHeight: `${maxHeight}px`
        }}
        role="listbox"
        aria-label="Category dropdown"
      >
        {/* Dropdown Arrow */}
        <div
          className={`
            absolute w-0 h-0 border-l-8 border-r-8 border-transparent z-10
            ${actualPlacement === 'top' 
              ? 'border-t-8 border-t-card bottom-[-8px]' 
              : 'border-b-8 border-b-card top-[-8px]'
            }
          `}
          style={{
            left: triggerRef.current 
              ? Math.min(
                  Math.max(16, triggerRef.current.getBoundingClientRect().width / 2 - 8),
                  position.width - 32
                )
              : 16
          }}
        />
        
        {/* Border Arrow (for visual enhancement) */}
        <div
          className={`
            absolute w-0 h-0 border-l-8 border-r-8 border-transparent
            ${actualPlacement === 'top' 
              ? 'border-t-8 border-t-border bottom-[-9px]' 
              : 'border-b-8 border-b-border top-[-9px]'
            }
          `}
          style={{
            left: triggerRef.current 
              ? Math.min(
                  Math.max(16, triggerRef.current.getBoundingClientRect().width / 2 - 8),
                  position.width - 32
                )
              : 16
          }}
        />
        
        {/* Content */}
        <div className="relative bg-card text-card-foreground rounded-md overflow-hidden">
          {children}
        </div>
      </div>
    </>
  );
};

export default TreeDropdown;