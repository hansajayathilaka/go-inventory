import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import { useCategoriesWithService } from '@/hooks/useInventoryQueries'
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@/types/category'

// Validation schema
const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long'),
  parent_id: z.string().optional(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

interface CategoryFormProps {
  category?: Category
  onSubmit: (data: CreateCategoryRequest | UpdateCategoryRequest) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  isEditing?: boolean
  parentCategories?: Category[]
}

export function CategoryForm({
  category,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditing = false,
  parentCategories = []
}: CategoryFormProps) {
  const { data: allCategoriesData } = useCategoriesWithService({ page_size: 1000 })
  const allCategories = allCategoriesData?.data || []

  // Use provided categories or fetch all categories
  const availableParents = parentCategories.length > 0 ? parentCategories : allCategories

  // Form setup
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      parent_id: category?.parent_id || 'none',
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form

  const watchedParentId = watch('parent_id')

  const handleFormSubmit = async (data: CategoryFormValues) => {
    try {
      const submitData = {
        name: data.name,
        description: data.description,
        parent_id: data.parent_id === 'none' ? null : data.parent_id,
      }

      await onSubmit(submitData)
    } catch (error) {
      console.error('Failed to submit category form:', error)
    }
  }

  // Helper function to get all descendant IDs (to prevent circular references)
  const getDescendantIds = (catId: string, categories: Category[]): string[] => {
    const descendants: string[] = []
    const children = categories.filter(c => c.parent_id === catId)
    children.forEach(child => {
      descendants.push(child.id)
      descendants.push(...getDescendantIds(child.id, categories))
    })
    return descendants
  }

  const filteredParentCategories = availableParents.filter(cat => {
    // Don't allow selecting self as parent when editing
    if (isEditing && cat.id === category?.id) return false

    // Don't allow selecting descendants as parent (prevents circular references)
    if (isEditing && category) {
      const descendantIds = getDescendantIds(category.id, availableParents)
      if (descendantIds.includes(cat.id)) return false
    }

    // Don't allow selecting categories at level 4 or higher as parents (max depth is 5)
    if (cat.level >= 4) return false

    return true
  })

  // Sort categories by level and name for better hierarchy display
  const sortedParentCategories = filteredParentCategories.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level
    return a.name.localeCompare(b.name)
  })

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Category Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Category Name *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Enter category name"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.name.message}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Enter category description (optional)"
          rows={3}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.description.message}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Parent Category */}
      <div className="space-y-2">
        <Label htmlFor="parent_id">Parent Category</Label>
        <Select
          value={watchedParentId}
          onValueChange={(value) => setValue('parent_id', value)}
        >
          <SelectTrigger className={errors.parent_id ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select parent category (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Parent (Root Category)</SelectItem>
            {sortedParentCategories.map((parentCat) => (
              <SelectItem key={parentCat.id} value={parentCat.id}>
                <div className="flex items-center gap-2">
                  <span>{'  '.repeat(parentCat.level)}</span>
                  <span>{parentCat.name}</span>
                  <span className="text-xs text-muted-foreground">
                    (Level {parentCat.level})
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.parent_id && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.parent_id.message}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Info about hierarchy */}
      {watchedParentId && watchedParentId !== 'none' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This category will be created as a subcategory. Categories can have up to 5 levels of depth.
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
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            isEditing ? 'Update Category' : 'Create Category'
          )}
        </Button>
      </div>
    </form>
  )
}