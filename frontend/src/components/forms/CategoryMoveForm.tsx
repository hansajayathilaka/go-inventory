import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, Move } from 'lucide-react'
import { useCategoriesWithService } from '@/hooks/useInventoryQueries'
import type { Category, MoveCategoryRequest } from '@/types/category'

// Validation schema
const moveCategorySchema = z.object({
  new_parent_id: z.string().optional(),
})

type MoveCategoryFormValues = z.infer<typeof moveCategorySchema>

interface CategoryMoveFormProps {
  category: Category
  onSubmit: (data: MoveCategoryRequest) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  availableCategories?: Category[]
}

export function CategoryMoveForm({
  category,
  onSubmit,
  onCancel,
  isLoading = false,
  availableCategories = []
}: CategoryMoveFormProps) {
  const { data: allCategoriesData } = useCategoriesWithService({ page_size: 1000 })

  // Get all categories to choose from
  const allCategories = allCategoriesData?.data || availableCategories

  // Form setup
  const form = useForm<MoveCategoryFormValues>({
    resolver: zodResolver(moveCategorySchema),
    defaultValues: {
      new_parent_id: category.parent_id || 'none',
    },
  })

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form

  const watchedParentId = watch('new_parent_id')

  const handleFormSubmit = async (data: MoveCategoryFormValues) => {
    try {
      const submitData = {
        new_parent_id: data.new_parent_id === 'none' ? null : data.new_parent_id,
      }

      await onSubmit(submitData)
    } catch (error) {
      console.error('Failed to move category:', error)
    }
  }

  // Filter out categories that cannot be parents:
  // - The category itself
  // - Its descendants (to prevent circular references)
  const getDescendantIds = (catId: string, categories: Category[]): string[] => {
    const descendants: string[] = []
    const children = categories.filter(c => c.parent_id === catId)
    children.forEach(child => {
      descendants.push(child.id)
      descendants.push(...getDescendantIds(child.id, categories))
    })
    return descendants
  }

  const descendantIds = getDescendantIds(category.id, allCategories)
  const excludedIds = new Set([category.id, ...descendantIds])

  const filteredCategories = allCategories.filter(cat =>
    !excludedIds.has(cat.id) && cat.level < 4 // Max depth is 5, so parent can be max level 4
  )

  // Sort by level and name for better hierarchy display
  const sortedCategories = filteredCategories.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level
    return a.name.localeCompare(b.name)
  })

  const getCurrentPath = () => {
    if (!category.path) return 'Root'
    return category.path
  }

  const getNewPath = (newParentId: string | undefined) => {
    if (!newParentId || newParentId === 'none') {
      return category.name
    }
    const parent = allCategories.find(c => c.id === newParentId)
    if (parent) {
      return `${parent.path}/${category.name}`
    }
    return category.name
  }

  return (
    <div className="space-y-6">
      {/* Current location info */}
      <Alert>
        <Move className="h-4 w-4" />
        <AlertDescription>
          <strong>Moving:</strong> {category.name}<br />
          <strong>Current path:</strong> {getCurrentPath()}
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* New Parent Category */}
        <div className="space-y-2">
          <Label htmlFor="new_parent_id">New Parent Category</Label>
          <Select
            value={watchedParentId}
            onValueChange={(value) => setValue('new_parent_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select new parent category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Parent (Move to Root)</SelectItem>
              {sortedCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <span>{'  '.repeat(cat.level)}</span>
                    <span>{cat.name}</span>
                    <span className="text-xs text-muted-foreground">
                      (Level {cat.level})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.new_parent_id && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.new_parent_id.message}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Preview new path */}
        {watchedParentId !== undefined && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>New path will be:</strong> {getNewPath(watchedParentId)}
            </AlertDescription>
          </Alert>
        )}

        {/* Warnings */}
        {category.children_count > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This category has {category.children_count} subcategories that will also be moved to maintain the hierarchy.
            </AlertDescription>
          </Alert>
        )}

        {category.product_count > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This category contains {category.product_count} products that will remain in this category after moving.
            </AlertDescription>
          </Alert>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || watchedParentId === (category.parent_id || 'none')}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Moving...
              </>
            ) : (
              'Move Category'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}