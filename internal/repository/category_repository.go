package repository

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

type categoryRepository struct {
	db *gorm.DB
}

func NewCategoryRepository(db *gorm.DB) interfaces.CategoryRepository {
	return &categoryRepository{db: db}
}

func (r *categoryRepository) Create(ctx context.Context, category *models.Category) error {
	return r.db.WithContext(ctx).Create(category).Error
}

func (r *categoryRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Category, error) {
	var category models.Category
	err := r.db.WithContext(ctx).Preload("Parent").Preload("Children").First(&category, id).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *categoryRepository) GetByName(ctx context.Context, name string) (*models.Category, error) {
	var category models.Category
	err := r.db.WithContext(ctx).Where("name = ?", name).First(&category).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *categoryRepository) Update(ctx context.Context, category *models.Category) error {
	return r.db.WithContext(ctx).Save(category).Error
}

func (r *categoryRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Category{}, id).Error
}

func (r *categoryRepository) List(ctx context.Context, limit, offset int) ([]*models.Category, error) {
	var categories []*models.Category
	err := r.db.WithContext(ctx).Preload("Parent").Limit(limit).Offset(offset).Find(&categories).Error
	return categories, err
}

func (r *categoryRepository) GetChildren(ctx context.Context, parentID uuid.UUID) ([]*models.Category, error) {
	var categories []*models.Category
	err := r.db.WithContext(ctx).Where("parent_id = ?", parentID).Find(&categories).Error
	return categories, err
}

func (r *categoryRepository) GetByLevel(ctx context.Context, level int) ([]*models.Category, error) {
	var categories []*models.Category
	err := r.db.WithContext(ctx).Where("level = ?", level).Find(&categories).Error
	return categories, err
}

func (r *categoryRepository) GetRootCategories(ctx context.Context) ([]*models.Category, error) {
	var categories []*models.Category
	err := r.db.WithContext(ctx).Where("parent_id IS NULL").Find(&categories).Error
	return categories, err
}

func (r *categoryRepository) GetCategoryPath(ctx context.Context, id uuid.UUID) ([]*models.Category, error) {
	var categories []*models.Category
	var category models.Category
	
	if err := r.db.WithContext(ctx).First(&category, id).Error; err != nil {
		return nil, err
	}
	
	categories = append(categories, &category)
	
	for category.ParentID != nil {
		if err := r.db.WithContext(ctx).First(&category, *category.ParentID).Error; err != nil {
			break
		}
		categories = append([]*models.Category{&category}, categories...)
	}
	
	return categories, nil
}

func (r *categoryRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.Category{}).Count(&count).Error
	return count, err
}

func (r *categoryRepository) Search(ctx context.Context, query string) ([]*models.Category, error) {
	var categories []*models.Category
	searchTerm := "%" + query + "%"
	err := r.db.WithContext(ctx).
		Where("name ILIKE ? OR description ILIKE ?", searchTerm, searchTerm).
		Order("name ASC").
		Find(&categories).Error
	return categories, err
}