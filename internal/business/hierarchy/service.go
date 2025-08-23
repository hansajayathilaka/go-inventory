package hierarchy

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"tui-inventory/internal/repository/interfaces"
	"tui-inventory/internal/repository/models"
)

var (
	ErrCategoryNotFound    = errors.New("category not found")
	ErrCategoryExists      = errors.New("category already exists")
	ErrInvalidParent       = errors.New("invalid parent category")
	ErrCircularReference   = errors.New("circular reference detected")
	ErrCategoryHasProducts = errors.New("category has products and cannot be deleted")
	ErrMaxDepthExceeded    = errors.New("maximum category depth exceeded")
)

const MaxCategoryDepth = 5

type Service interface {
	CreateCategory(ctx context.Context, name, description string, parentID *uuid.UUID) (*models.Category, error)
	GetCategoryByID(ctx context.Context, id uuid.UUID) (*models.Category, error)
	GetCategoryByName(ctx context.Context, name string) (*models.Category, error)
	UpdateCategory(ctx context.Context, category *models.Category) error
	DeleteCategory(ctx context.Context, id uuid.UUID) error
	ListCategories(ctx context.Context, limit, offset int) ([]*models.Category, error)
	GetRootCategories(ctx context.Context) ([]*models.Category, error)
	GetCategoryChildren(ctx context.Context, parentID uuid.UUID) ([]*models.Category, error)
	GetCategoryPath(ctx context.Context, id uuid.UUID) ([]*models.Category, error)
	GetCategoriesByLevel(ctx context.Context, level int) ([]*models.Category, error)
	MoveCategory(ctx context.Context, id uuid.UUID, newParentID *uuid.UUID) error
	GetCategoryHierarchy(ctx context.Context, rootID *uuid.UUID) (*CategoryNode, error)
	ValidateCategoryMove(ctx context.Context, categoryID uuid.UUID, newParentID *uuid.UUID) error
}

type CategoryNode struct {
	Category *models.Category `json:"category"`
	Children []*CategoryNode  `json:"children"`
}

type service struct {
	categoryRepo interfaces.CategoryRepository
	productRepo  interfaces.ProductRepository
}

func NewService(categoryRepo interfaces.CategoryRepository, productRepo interfaces.ProductRepository) Service {
	return &service{
		categoryRepo: categoryRepo,
		productRepo:  productRepo,
	}
}

func (s *service) CreateCategory(ctx context.Context, name, description string, parentID *uuid.UUID) (*models.Category, error) {
	existing, _ := s.categoryRepo.GetByName(ctx, name)
	if existing != nil {
		return nil, ErrCategoryExists
	}

	level := 0
	path := name

	if parentID != nil {
		parent, err := s.categoryRepo.GetByID(ctx, *parentID)
		if err != nil {
			return nil, ErrInvalidParent
		}

		level = parent.Level + 1
		if level > MaxCategoryDepth {
			return nil, ErrMaxDepthExceeded
		}

		path = parent.Path + "/" + name
	}

	category := &models.Category{
		Name:        name,
		Description: description,
		ParentID:    parentID,
		Level:       level,
		Path:        path,
	}

	if err := s.categoryRepo.Create(ctx, category); err != nil {
		return nil, err
	}

	return category, nil
}

func (s *service) GetCategoryByID(ctx context.Context, id uuid.UUID) (*models.Category, error) {
	return s.categoryRepo.GetByID(ctx, id)
}

func (s *service) GetCategoryByName(ctx context.Context, name string) (*models.Category, error) {
	return s.categoryRepo.GetByName(ctx, name)
}

func (s *service) UpdateCategory(ctx context.Context, category *models.Category) error {
	existing, err := s.categoryRepo.GetByID(ctx, category.ID)
	if err != nil {
		return ErrCategoryNotFound
	}

	if existing.Name != category.Name {
		nameExists, _ := s.categoryRepo.GetByName(ctx, category.Name)
		if nameExists != nil && nameExists.ID != category.ID {
			return ErrCategoryExists
		}
	}

	if err := s.updateCategoryPath(ctx, category); err != nil {
		return err
	}

	return s.categoryRepo.Update(ctx, category)
}

func (s *service) DeleteCategory(ctx context.Context, id uuid.UUID) error {
	_, err := s.categoryRepo.GetByID(ctx, id)
	if err != nil {
		return ErrCategoryNotFound
	}

	products, err := s.productRepo.GetByCategory(ctx, id)
	if err == nil && len(products) > 0 {
		return ErrCategoryHasProducts
	}

	children, err := s.categoryRepo.GetChildren(ctx, id)
	if err == nil && len(children) > 0 {
		return errors.New("category has subcategories and cannot be deleted")
	}

	return s.categoryRepo.Delete(ctx, id)
}

func (s *service) ListCategories(ctx context.Context, limit, offset int) ([]*models.Category, error) {
	return s.categoryRepo.List(ctx, limit, offset)
}

func (s *service) GetRootCategories(ctx context.Context) ([]*models.Category, error) {
	return s.categoryRepo.GetRootCategories(ctx)
}

func (s *service) GetCategoryChildren(ctx context.Context, parentID uuid.UUID) ([]*models.Category, error) {
	return s.categoryRepo.GetChildren(ctx, parentID)
}

func (s *service) GetCategoryPath(ctx context.Context, id uuid.UUID) ([]*models.Category, error) {
	return s.categoryRepo.GetCategoryPath(ctx, id)
}

func (s *service) GetCategoriesByLevel(ctx context.Context, level int) ([]*models.Category, error) {
	return s.categoryRepo.GetByLevel(ctx, level)
}

func (s *service) MoveCategory(ctx context.Context, id uuid.UUID, newParentID *uuid.UUID) error {
	if err := s.ValidateCategoryMove(ctx, id, newParentID); err != nil {
		return err
	}

	category, err := s.categoryRepo.GetByID(ctx, id)
	if err != nil {
		return ErrCategoryNotFound
	}

	category.ParentID = newParentID

	if err := s.updateCategoryPath(ctx, category); err != nil {
		return err
	}

	if err := s.categoryRepo.Update(ctx, category); err != nil {
		return err
	}

	return s.updateChildrenPaths(ctx, category)
}

func (s *service) GetCategoryHierarchy(ctx context.Context, rootID *uuid.UUID) (*CategoryNode, error) {
	var rootCategories []*models.Category
	var err error

	if rootID != nil {
		root, err := s.categoryRepo.GetByID(ctx, *rootID)
		if err != nil {
			return nil, err
		}
		rootCategories = []*models.Category{root}
	} else {
		rootCategories, err = s.categoryRepo.GetRootCategories(ctx)
		if err != nil {
			return nil, err
		}
	}

	if len(rootCategories) == 0 {
		return nil, ErrCategoryNotFound
	}

	if len(rootCategories) == 1 {
		return s.buildCategoryNode(ctx, rootCategories[0])
	}

	virtualRoot := &models.Category{
		Name:  "Root",
		Level: -1,
	}
	rootNode := &CategoryNode{
		Category: virtualRoot,
		Children: make([]*CategoryNode, 0, len(rootCategories)),
	}

	for _, category := range rootCategories {
		node, err := s.buildCategoryNode(ctx, category)
		if err != nil {
			return nil, err
		}
		rootNode.Children = append(rootNode.Children, node)
	}

	return rootNode, nil
}

func (s *service) ValidateCategoryMove(ctx context.Context, categoryID uuid.UUID, newParentID *uuid.UUID) error {
	_, err := s.categoryRepo.GetByID(ctx, categoryID)
	if err != nil {
		return ErrCategoryNotFound
	}

	if newParentID == nil {
		return nil
	}

	newParent, err := s.categoryRepo.GetByID(ctx, *newParentID)
	if err != nil {
		return ErrInvalidParent
	}

	if newParent.Level+1 > MaxCategoryDepth {
		return ErrMaxDepthExceeded
	}

	if categoryID == *newParentID {
		return ErrCircularReference
	}

	path, err := s.categoryRepo.GetCategoryPath(ctx, *newParentID)
	if err != nil {
		return err
	}

	for _, pathCategory := range path {
		if pathCategory.ID == categoryID {
			return ErrCircularReference
		}
	}

	return nil
}

func (s *service) updateCategoryPath(ctx context.Context, category *models.Category) error {
	if category.ParentID == nil {
		category.Level = 0
		category.Path = category.Name
		return nil
	}

	parent, err := s.categoryRepo.GetByID(ctx, *category.ParentID)
	if err != nil {
		return ErrInvalidParent
	}

	category.Level = parent.Level + 1
	if category.Level > MaxCategoryDepth {
		return ErrMaxDepthExceeded
	}

	category.Path = parent.Path + "/" + category.Name
	return nil
}

func (s *service) updateChildrenPaths(ctx context.Context, parent *models.Category) error {
	children, err := s.categoryRepo.GetChildren(ctx, parent.ID)
	if err != nil {
		return err
	}

	for _, child := range children {
		if err := s.updateCategoryPath(ctx, child); err != nil {
			return err
		}

		if err := s.categoryRepo.Update(ctx, child); err != nil {
			return err
		}

		if err := s.updateChildrenPaths(ctx, child); err != nil {
			return err
		}
	}

	return nil
}

func (s *service) buildCategoryNode(ctx context.Context, category *models.Category) (*CategoryNode, error) {
	node := &CategoryNode{
		Category: category,
		Children: []*CategoryNode{},
	}

	children, err := s.categoryRepo.GetChildren(ctx, category.ID)
	if err != nil {
		return node, nil
	}

	for _, child := range children {
		childNode, err := s.buildCategoryNode(ctx, child)
		if err != nil {
			return nil, err
		}
		node.Children = append(node.Children, childNode)
	}

	return node, nil
}