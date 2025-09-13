import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  FolderOpen,
  Folder,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Edit,
  Trash2,
  Move,
  List
} from 'lucide-react'
import {
  useCategoriesWithService,
  useRootCategories,
  useCreateCategoryWithService,
  useUpdateCategory,
  useDeleteCategory,
  useMoveCategory,
  useSearchCategories
} from '@/hooks/useInventoryQueries'
import { CategoryForm } from '@/components/forms/CategoryForm'
import { CategoryMoveForm } from '@/components/forms/CategoryMoveForm'
import type { Category } from '@/types/category'

// Tree node component for hierarchical view
interface TreeNodeProps {
  category: Category
  level: number
  isExpanded: boolean
  onToggleExpanded: (id: string) => void
  onEdit: (category: Category) => void
  onMove: (category: Category) => void
  onDelete: (category: Category) => void
  children: Category[]
  allCategories: Category[]
}

function TreeNode({
  category,
  level,
  isExpanded,
  onToggleExpanded,
  onEdit,
  onMove,
  onDelete,
  children,
  allCategories
}: TreeNodeProps) {
  const hasChildren = category.children_count > 0 || children.length > 0
  const indentWidth = level * 24

  const getLevelBadgeColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 1: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 2: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 3: return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 4: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div>
      <div className="flex items-center py-2 px-4 hover:bg-muted/50 border-b border-border/50">
        <div className="flex items-center flex-1" style={{ paddingLeft: `${indentWidth}px` }}>
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 mr-2"
              onClick={() => onToggleExpanded(category.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="w-6 mr-2" />
          )}

          <div className="flex items-center mr-3">
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4 text-blue-500" />
              ) : (
                <Folder className="h-4 w-4 text-blue-500" />
              )
            ) : (
              <Folder className="h-4 w-4 text-gray-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="font-medium truncate">{category.name}</span>
              <Badge className={getLevelBadgeColor(category.level)}>
                L{category.level}
              </Badge>
              {category.children_count > 0 && (
                <Badge variant="outline">
                  {category.children_count} children
                </Badge>
              )}
              {category.product_count > 0 && (
                <Badge variant="secondary">
                  {category.product_count} products
                </Badge>
              )}
            </div>
            {category.description && (
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {category.description}
              </p>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(category)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMove(category)}>
              <Move className="mr-2 h-4 w-4" />
              Move
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => onDelete(category)}
              disabled={category.children_count > 0 || category.product_count > 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {children.map((child) => (
            <TreeNodeContainer
              key={child.id}
              category={child}
              level={level + 1}
              onEdit={onEdit}
              onMove={onMove}
              onDelete={onDelete}
              allCategories={allCategories}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Container component that manages expanded state for each node
function TreeNodeContainer({
  category,
  level,
  onEdit,
  onMove,
  onDelete,
  allCategories
}: {
  category: Category
  level: number
  onEdit: (category: Category) => void
  onMove: (category: Category) => void
  onDelete: (category: Category) => void
  allCategories: Category[]
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  // Get children from all categories
  const children = allCategories.filter(cat => cat.parent_id === category.id)

  return (
    <TreeNode
      category={category}
      level={level}
      isExpanded={isExpanded}
      onToggleExpanded={handleToggleExpanded}
      onEdit={onEdit}
      onMove={onMove}
      onDelete={onDelete}
      children={children}
      allCategories={allCategories}
    />
  )
}

export function Categories() {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('')
  const [parentFilter, setParentFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [view, setView] = useState<'list' | 'tree'>('list')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [movingCategory, setMovingCategory] = useState<Category | null>(null)

  // Build query parameters
  const queryParams = useMemo(() => {
    const params: any = { page, page_size: limit }
    if (search.trim()) params.q = search.trim()
    if (levelFilter && levelFilter !== 'all') params.level = parseInt(levelFilter)
    if (parentFilter && parentFilter !== 'all') {
      params.parent_id = parentFilter === 'root' ? 'null' : parentFilter
    }
    return params
  }, [search, levelFilter, parentFilter, page, limit])

  // Fetch data
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } =
    search.trim() && view === 'list' ?
      { data: null, isLoading: false, error: null } : // Don't use list when searching in list view
      useCategoriesWithService(queryParams)

  const { data: searchResults, isLoading: searchLoading } = useSearchCategories(search.trim())
  const { data: rootCategories = [] } = useRootCategories()

  // For tree view, fetch all categories to build the hierarchy
  const { data: allCategoriesData, isLoading: allCategoriesLoading } = useCategoriesWithService({ page_size: 1000 })
  const allCategories = allCategoriesData?.data || []

  // Mutations
  const createCategory = useCreateCategoryWithService()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()
  const moveCategory = useMoveCategory()

  // Data selection based on view and search
  const categories = search.trim() ? (searchResults || []) : (categoriesData?.data || [])
  const isLoading = search.trim() ? searchLoading : (view === 'tree' ? allCategoriesLoading : categoriesLoading)
  const totalCount = search.trim() ? (searchResults?.length || 0) : (categoriesData?.pagination?.total || 0)
  const totalPages = search.trim() ? 1 : (categoriesData?.pagination?.total_pages || 1)

  const handleCreateCategory = async (data: any) => {
    try {
      await createCategory.mutateAsync(data)
      setShowCreateDialog(false)
    } catch (error) {
      console.error('Failed to create category:', error)
    }
  }

  const handleUpdateCategory = async (data: any) => {
    if (!editingCategory) return
    try {
      await updateCategory.mutateAsync({ id: editingCategory.id, data })
      setEditingCategory(null)
    } catch (error) {
      console.error('Failed to update category:', error)
    }
  }

  const handleDeleteCategory = async (category: Category) => {
    if (category.children_count > 0) {
      alert('Cannot delete category that has subcategories. Please move or delete subcategories first.')
      return
    }
    if (category.product_count > 0) {
      alert('Cannot delete category that has products. Please move products to another category first.')
      return
    }

    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      try {
        await deleteCategory.mutateAsync(category.id)
      } catch (error) {
        console.error('Failed to delete category:', error)
      }
    }
  }

  const handleMoveCategory = async (data: any) => {
    if (!movingCategory) return
    try {
      await moveCategory.mutateAsync({ id: movingCategory.id, data })
      setMovingCategory(null)
    } catch (error) {
      console.error('Failed to move category:', error)
    }
  }

  const getLevelBadgeColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 1: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 2: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 3: return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 4: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  // Render list view table
  const renderListView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Level</TableHead>
          <TableHead>Path</TableHead>
          <TableHead>Children</TableHead>
          <TableHead>Products</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category.id} className="hover:bg-muted/50">
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                {category.children_count > 0 ? (
                  <FolderOpen className="h-4 w-4 text-blue-500" />
                ) : (
                  <Folder className="h-4 w-4 text-gray-400" />
                )}
                <span>{category.name}</span>
              </div>
            </TableCell>
            <TableCell>
              {category.description || '—'}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={getLevelBadgeColor(category.level)}
              >
                Level {category.level}
              </Badge>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">
                {category.path}
              </span>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">
                {category.children_count} children
              </span>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">
                {category.product_count} products
              </span>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingCategory(category)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMovingCategory(category)}
                  className="h-8 w-8 p-0"
                >
                  <Move className="h-4 w-4" />
                  <span className="sr-only">Move</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteCategory(category)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={category.children_count > 0 || category.product_count > 0}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  // Render tree view
  const renderTreeView = () => (
    <div className="space-y-2">
      {rootCategories.map((category) => (
        <TreeNodeContainer
          key={category.id}
          category={category}
          level={0}
          onEdit={setEditingCategory}
          onMove={setMovingCategory}
          onDelete={handleDeleteCategory}
          allCategories={allCategories}
        />
      ))}
    </div>
  )

  if (categoriesError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load categories: {categoriesError.message}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Category Management</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              className="px-3"
            >
              <List className="mr-2 h-4 w-4" />
              List
            </Button>
            <Button
              variant={view === 'tree' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('tree')}
              className="px-3"
            >
              <FolderTree className="mr-2 h-4 w-4" />
              Tree
            </Button>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
              </DialogHeader>
              <CategoryForm
                onSubmit={handleCreateCategory}
                onCancel={() => setShowCreateDialog(false)}
                isLoading={createCategory.isPending}
                parentCategories={allCategories}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters - Only show for list view */}
      {view === 'list' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="0">Level 0 (Root)</SelectItem>
                    <SelectItem value="1">Level 1</SelectItem>
                    <SelectItem value="2">Level 2</SelectItem>
                    <SelectItem value="3">Level 3</SelectItem>
                    <SelectItem value="4">Level 4</SelectItem>
                    <SelectItem value="5">Level 5</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={parentFilter} onValueChange={setParentFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="root">Root Categories Only</SelectItem>
                    {rootCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories Table/Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {view === 'list' ? 'Categories' : 'Category Hierarchy'}
            {view === 'list' && totalCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                {totalCount} total, showing {categories.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">Loading categories...</div>
            </div>
          ) : categoriesError ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-red-600">Error loading categories</div>
            </div>
          ) : view === 'list' && categories.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">
                {search || levelFilter || parentFilter !== 'all'
                  ? 'No categories match your filters'
                  : 'No categories yet'}
              </div>
            </div>
          ) : view === 'tree' && rootCategories.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">
                No categories found. Create your first category to get started.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {view === 'list' ? renderListView() : renderTreeView()}

              {/* Pagination - Only for list view */}
              {view === 'list' && !search && totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              category={editingCategory}
              onSubmit={handleUpdateCategory}
              onCancel={() => setEditingCategory(null)}
              isLoading={updateCategory.isPending}
              isEditing
              parentCategories={allCategories}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Move Category Dialog */}
      <Dialog open={!!movingCategory} onOpenChange={() => setMovingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Category</DialogTitle>
          </DialogHeader>
          {movingCategory && (
            <CategoryMoveForm
              category={movingCategory}
              onSubmit={handleMoveCategory}
              onCancel={() => setMovingCategory(null)}
              isLoading={moveCategory.isPending}
              availableCategories={rootCategories}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}