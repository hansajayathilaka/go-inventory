import { useState, useEffect } from 'react'
import { Check, ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface HierarchicalItem {
  id: string | number
  name: string
  level: number
  path: string
  parent_id?: string | number
  children?: HierarchicalItem[]
}

interface HierarchicalSelectProps {
  value?: string | number
  onValueChange: (value: string | number | undefined) => void
  placeholder?: string
  items: HierarchicalItem[]
  disabled?: boolean
  className?: string
}

export function HierarchicalSelect({
  value,
  onValueChange,
  placeholder = 'Select item...',
  items,
  disabled = false,
  className,
}: HierarchicalSelectProps) {
  const [open, setOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string | number>>(new Set())
  const [selectedItem, setSelectedItem] = useState<HierarchicalItem | null>(null)

  // Find selected item when value changes
  useEffect(() => {
    if (value) {
      const findItem = (items: HierarchicalItem[]): HierarchicalItem | null => {
        for (const item of items) {
          if (item.id === value) return item
          if (item.children) {
            const found = findItem(item.children)
            if (found) return found
          }
        }
        return null
      }
      setSelectedItem(findItem(items))
    } else {
      setSelectedItem(null)
    }
  }, [value, items])

  // Auto-expand to show selected item
  useEffect(() => {
    if (selectedItem && selectedItem.parent_id) {
      const newExpanded = new Set(expandedItems)
      
      // Find all parent IDs and expand them
      const findAndExpandParents = (items: HierarchicalItem[], targetId: string | number): void => {
        for (const item of items) {
          if (item.children) {
            for (const child of item.children) {
              if (child.id === targetId) {
                newExpanded.add(item.id)
                if (item.parent_id) {
                  findAndExpandParents(items, item.parent_id)
                }
                return
              }
            }
            findAndExpandParents(item.children, targetId)
          }
        }
      }
      
      findAndExpandParents(items, selectedItem.id)
      setExpandedItems(newExpanded)
    }
  }, [selectedItem, items])

  const toggleExpanded = (itemId: string | number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const handleSelect = (item: HierarchicalItem) => {
    if (value === item.id) {
      onValueChange(undefined)
    } else {
      onValueChange(item.id)
    }
    setOpen(false)
  }

  const renderItems = (items: HierarchicalItem[], level: number = 0) => {
    return items.map((item) => {
      const hasChildren = item.children && item.children.length > 0
      const isExpanded = expandedItems.has(item.id)
      const isSelected = value === item.id
      const indentLevel = level * 16

      return (
        <div key={item.id}>
          <CommandItem
            value={item.path}
            onSelect={() => handleSelect(item)}
            className={cn(
              'flex items-center gap-2 cursor-pointer',
              isSelected && 'bg-accent'
            )}
            style={{ paddingLeft: `${8 + indentLevel}px` }}
          >
            <div className="flex items-center gap-1 flex-1">
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleExpanded(item.id)
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              ) : (
                <div className="w-4" />
              )}
              
              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="h-4 w-4 text-blue-500" />
                ) : (
                  <Folder className="h-4 w-4 text-blue-500" />
                )
              ) : (
                <div className="h-4 w-4" />
              )}
              
              <span className="flex-1">{item.name}</span>
              
              <Check
                className={cn(
                  'h-4 w-4',
                  isSelected ? 'opacity-100' : 'opacity-0'
                )}
              />
            </div>
          </CommandItem>
          
          {hasChildren && isExpanded && item.children && (
            <div>
              {renderItems(item.children, level + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between', className)}
          disabled={disabled}
        >
          {selectedItem ? (
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-blue-500" />
              <span className="truncate">{selectedItem.path}</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search categories..." />
          <CommandEmpty>No category found.</CommandEmpty>
          <CommandList className="max-h-[300px] overflow-auto">
            <CommandGroup>
              {/* Clear selection option */}
              <CommandItem
                value=""
                onSelect={() => {
                  onValueChange(undefined)
                  setOpen(false)
                }}
                className="flex items-center gap-2"
              >
                <div className="w-4" />
                <div className="w-4" />
                <span className="text-muted-foreground italic">No Category</span>
                <Check
                  className={cn(
                    'h-4 w-4 ml-auto',
                    !value ? 'opacity-100' : 'opacity-0'
                  )}
                />
              </CommandItem>
              
              {renderItems(items)}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}