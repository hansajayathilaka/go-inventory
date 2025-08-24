package hierarchy

import (
	"context"
	"testing"

	"inventory-api/internal/repository/models"

	"github.com/google/uuid"
)

// Smart mock implementations for testing core hierarchy service logic
type smartCategoryRepo struct {
	categories map[uuid.UUID]*models.Category
}

func (r *smartCategoryRepo) Create(ctx context.Context, category *models.Category) error {
	category.ID = uuid.New()
	if r.categories == nil {
		r.categories = make(map[uuid.UUID]*models.Category)
	}
	r.categories[category.ID] = category
	return nil
}

func (r *smartCategoryRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Category, error) {
	if r.categories == nil {
		r.categories = make(map[uuid.UUID]*models.Category)
	}
	if category, exists := r.categories[id]; exists {
		return category, nil
	}
	return nil, ErrCategoryNotFound
}

func (r *smartCategoryRepo) GetByName(ctx context.Context, name string) (*models.Category, error) {
	if r.categories == nil {
		r.categories = make(map[uuid.UUID]*models.Category)
	}
	for _, category := range r.categories {
		if category.Name == name {
			return category, nil
		}
	}
	return nil, ErrCategoryNotFound
}

func (r *smartCategoryRepo) Update(ctx context.Context, category *models.Category) error {
	if r.categories == nil {
		r.categories = make(map[uuid.UUID]*models.Category)
	}
	r.categories[category.ID] = category
	return nil
}

func (r *smartCategoryRepo) Delete(ctx context.Context, id uuid.UUID) error {
	if r.categories == nil {
		r.categories = make(map[uuid.UUID]*models.Category)
	}
	delete(r.categories, id)
	return nil
}

func (r *smartCategoryRepo) List(ctx context.Context, limit, offset int) ([]*models.Category, error) {
	if r.categories == nil {
		return []*models.Category{}, nil
	}
	var result []*models.Category
	count := 0
	for _, category := range r.categories {
		if count >= offset {
			result = append(result, category)
			if len(result) >= limit {
				break
			}
		}
		count++
	}
	return result, nil
}

func (r *smartCategoryRepo) GetRootCategories(ctx context.Context) ([]*models.Category, error) {
	if r.categories == nil {
		return []*models.Category{}, nil
	}
	var result []*models.Category
	for _, category := range r.categories {
		if category.ParentID == nil {
			result = append(result, category)
		}
	}
	return result, nil
}

func (r *smartCategoryRepo) GetChildren(ctx context.Context, parentID uuid.UUID) ([]*models.Category, error) {
	if r.categories == nil {
		return []*models.Category{}, nil
	}
	var result []*models.Category
	for _, category := range r.categories {
		if category.ParentID != nil && *category.ParentID == parentID {
			result = append(result, category)
		}
	}
	return result, nil
}

func (r *smartCategoryRepo) GetCategoryPath(ctx context.Context, id uuid.UUID) ([]*models.Category, error) {
	if r.categories == nil {
		return nil, ErrCategoryNotFound
	}
	category, exists := r.categories[id]
	if !exists {
		return nil, ErrCategoryNotFound
	}

	var path []*models.Category
	current := category
	for current != nil {
		path = append([]*models.Category{current}, path...)
		if current.ParentID == nil {
			break
		}
		current = r.categories[*current.ParentID]
	}
	return path, nil
}

func (r *smartCategoryRepo) GetByLevel(ctx context.Context, level int) ([]*models.Category, error) {
	if r.categories == nil {
		return []*models.Category{}, nil
	}
	var result []*models.Category
	for _, category := range r.categories {
		if category.Level == level {
			result = append(result, category)
		}
	}
	return result, nil
}

func (r *smartCategoryRepo) Count(ctx context.Context) (int64, error) {
	if r.categories == nil {
		return 0, nil
	}
	return int64(len(r.categories)), nil
}

type minimalProductRepo struct{}

func (r *minimalProductRepo) GetByCategory(ctx context.Context, categoryID uuid.UUID) ([]*models.Product, error) {
	return nil, nil
}
func (r *minimalProductRepo) Create(ctx context.Context, product *models.Product) error { return nil }
func (r *minimalProductRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Product, error) {
	return nil, nil
}
func (r *minimalProductRepo) Update(ctx context.Context, product *models.Product) error { return nil }
func (r *minimalProductRepo) Delete(ctx context.Context, id uuid.UUID) error            { return nil }
func (r *minimalProductRepo) GetBySKU(ctx context.Context, sku string) (*models.Product, error) {
	return nil, nil
}
func (r *minimalProductRepo) GetByBarcode(ctx context.Context, barcode string) (*models.Product, error) {
	return nil, nil
}
func (r *minimalProductRepo) GetByName(ctx context.Context, name string) ([]*models.Product, error) {
	return nil, nil
}
func (r *minimalProductRepo) GetBySupplier(ctx context.Context, supplierID uuid.UUID) ([]*models.Product, error) {
	return nil, nil
}
func (r *minimalProductRepo) List(ctx context.Context, limit, offset int) ([]*models.Product, error) {
	return nil, nil
}
func (r *minimalProductRepo) Search(ctx context.Context, query string, limit, offset int) ([]*models.Product, error) {
	return nil, nil
}
func (r *minimalProductRepo) Count(ctx context.Context) (int64, error) { return 0, nil }
func (r *minimalProductRepo) GetActive(ctx context.Context) ([]*models.Product, error) {
	return nil, nil
}

func setupHierarchyService() Service {
	return NewService(
		&smartCategoryRepo{categories: make(map[uuid.UUID]*models.Category)},
		&minimalProductRepo{},
	)
}

// Test core business logic validation for categories
func TestCategoryValidation(t *testing.T) {
	service := setupHierarchyService()
	ctx := context.Background()

	// Test creating category with existing name should check for duplicates
	_, err := service.CreateCategory(ctx, "Electronics", "Electronic devices", nil)
	if err != nil {
		t.Errorf("Expected category creation to work with mock, got %v", err)
	}

	// Test creating category with invalid parent should be validated
	invalidParentID := uuid.New()
	_, err = service.CreateCategory(ctx, "Computers", "Computer systems", &invalidParentID)
	if err != ErrInvalidParent {
		t.Errorf("Expected ErrInvalidParent, got %v", err)
	}

	// Test getting non-existent category
	_, err = service.GetCategoryByID(ctx, uuid.New())
	if err != ErrCategoryNotFound {
		t.Errorf("Expected ErrCategoryNotFound, got %v", err)
	}

	// Test getting category by non-existent name
	_, err = service.GetCategoryByName(ctx, "NonExistent")
	if err != ErrCategoryNotFound {
		t.Errorf("Expected ErrCategoryNotFound, got %v", err)
	}
}

// Test category move validation
func TestCategoryMoveValidation(t *testing.T) {
	service := setupHierarchyService()
	ctx := context.Background()

	// Create a test category
	category, err := service.CreateCategory(ctx, "TestCategory", "Test category for move validation", nil)
	if err != nil {
		t.Fatalf("Failed to create test category: %v", err)
	}

	// Test moving to non-existent parent
	nonExistentParentID := uuid.New()
	err = service.ValidateCategoryMove(ctx, category.ID, &nonExistentParentID)
	if err != ErrInvalidParent {
		t.Errorf("Expected ErrInvalidParent for non-existent parent, got %v", err)
	}

	// Test moving category to itself
	err = service.ValidateCategoryMove(ctx, category.ID, &category.ID)
	if err != ErrCircularReference {
		t.Errorf("Expected ErrCircularReference for self-reference, got %v", err)
	}

	// Test moving non-existent category
	err = service.ValidateCategoryMove(ctx, uuid.New(), nil)
	if err != ErrCategoryNotFound {
		t.Errorf("Expected ErrCategoryNotFound for non-existent category, got %v", err)
	}

	// Test valid move (should work)
	parent, err := service.CreateCategory(ctx, "ParentCategory", "Parent category", nil)
	if err != nil {
		t.Fatalf("Failed to create parent category: %v", err)
	}

	err = service.ValidateCategoryMove(ctx, category.ID, &parent.ID)
	if err != nil {
		t.Errorf("Expected no error for valid move, got %v", err)
	}
}

// Test hierarchy operations
func TestHierarchyOperations(t *testing.T) {
	service := setupHierarchyService()
	ctx := context.Background()

	// Create test categories for hierarchy operations
	root, err := service.CreateCategory(ctx, "Root", "Root category", nil)
	if err != nil {
		t.Fatalf("Failed to create root category: %v", err)
	}

	child, err := service.CreateCategory(ctx, "Child", "Child category", &root.ID)
	if err != nil {
		t.Fatalf("Failed to create child category: %v", err)
	}

	// Test getting hierarchy for existing root
	hierarchy, err := service.GetCategoryHierarchy(ctx, &root.ID)
	if err != nil {
		t.Errorf("Expected no error for existing hierarchy root, got %v", err)
	}
	if hierarchy == nil {
		t.Error("Expected non-nil hierarchy")
	}

	// Test getting hierarchy for non-existent root
	nonExistentID := uuid.New()
	_, err = service.GetCategoryHierarchy(ctx, &nonExistentID)
	if err == nil {
		t.Error("Expected error for non-existent hierarchy root")
	}

	// Test getting path for existing category
	path, err := service.GetCategoryPath(ctx, child.ID)
	if err != nil {
		t.Errorf("Expected no error for existing category path, got %v", err)
	}
	if len(path) != 2 { // Root -> Child
		t.Errorf("Expected path length 2, got %d", len(path))
	}

	// Test getting path for non-existent category
	_, err = service.GetCategoryPath(ctx, uuid.New())
	if err != ErrCategoryNotFound {
		t.Errorf("Expected ErrCategoryNotFound for non-existent category path, got %v", err)
	}

	// Test getting children of existing category
	children, err := service.GetCategoryChildren(ctx, root.ID)
	if err != nil {
		t.Errorf("Expected no error getting children of existing category, got %v", err)
	}
	if len(children) != 1 {
		t.Errorf("Expected 1 child for root category, got %d", len(children))
	}

	// Test getting children of non-existent category
	children, err = service.GetCategoryChildren(ctx, uuid.New())
	if err != nil {
		t.Errorf("Expected no error getting children of non-existent category, got %v", err)
	}
	if len(children) != 0 {
		t.Errorf("Expected 0 children for non-existent category, got %d", len(children))
	}

	// Test getting categories by level
	level0Categories, err := service.GetCategoriesByLevel(ctx, 0)
	if err != nil {
		t.Errorf("Expected no error getting level 0 categories, got %v", err)
	}
	if len(level0Categories) != 1 {
		t.Errorf("Expected 1 category at level 0, got %d", len(level0Categories))
	}

	level1Categories, err := service.GetCategoriesByLevel(ctx, 1)
	if err != nil {
		t.Errorf("Expected no error getting level 1 categories, got %v", err)
	}
	if len(level1Categories) != 1 {
		t.Errorf("Expected 1 category at level 1, got %d", len(level1Categories))
	}
}

// Test category deletion validation
func TestCategoryDeletion(t *testing.T) {
	service := setupHierarchyService()
	ctx := context.Background()

	// Test deleting non-existent category
	err := service.DeleteCategory(ctx, uuid.New())
	if err != ErrCategoryNotFound {
		t.Errorf("Expected ErrCategoryNotFound for non-existent category, got %v", err)
	}
}
