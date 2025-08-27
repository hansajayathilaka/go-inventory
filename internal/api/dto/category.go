package dto

import (
	"encoding/json"
	"time"

	"inventory-api/internal/business/hierarchy"

	"github.com/google/uuid"
)

// CreateCategoryRequest represents the request to create a new category
// @Description Request payload for creating a new category
type CreateCategoryRequest struct {
	Name        string     `json:"name" binding:"required,min=1,max=100" example:"Electronics"`
	Description string     `json:"description" binding:"max=500" example:"Electronic devices and accessories"`
	ParentID    *uuid.UUID `json:"parent_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440000"`
} // @name CreateCategoryRequest

// UpdateCategoryRequest represents the request to update a category
// @Description Request payload for updating an existing category
type UpdateCategoryRequest struct {
	Name        string `json:"name" binding:"required,min=1,max=100" example:"Electronics"`
	Description string `json:"description" binding:"max=500" example:"Electronic devices and accessories"`
} // @name UpdateCategoryRequest

// CategoryResponse represents a category in API responses
// @Description Category information in API responses
type CategoryResponse struct {
	ID          uuid.UUID                `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Name        string                   `json:"name" example:"Electronics"`
	Description string                   `json:"description" example:"Electronic devices and accessories"`
	ParentID    *uuid.UUID               `json:"parent_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440001"`
	Level       int                      `json:"level" example:"1"`
	Path        string                   `json:"path" example:"Electronics/Computers"`
	ChildrenCount int                    `json:"children_count" example:"5"`
	CreatedAt   time.Time                `json:"created_at" example:"2024-01-15T09:30:00Z"`
	UpdatedAt   time.Time                `json:"updated_at" example:"2024-01-15T09:30:00Z"`
} // @name CategoryResponse

// CategoryListResponse represents a paginated list of categories
// @Description Paginated list of categories
type CategoryListResponse struct {
	Categories []CategoryResponse `json:"categories"`
	Pagination PaginationResponse `json:"pagination"`
} // @name CategoryListResponse

// CategoryHierarchyResponse represents a hierarchical category tree
// @Description Hierarchical representation of categories
type CategoryHierarchyResponse struct {
	Category *CategoryResponse            `json:"category"`
	Children []*CategoryHierarchyResponse `json:"children"`
} // @name CategoryHierarchyResponse

// MoveCategoryRequest represents the request to move a category
// @Description Request payload for moving a category to a different parent
type MoveCategoryRequest struct {
	NewParentID *uuid.UUID `json:"new_parent_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440002"`
} // @name MoveCategoryRequest

// CategoryPathResponse represents the path from root to a category
// @Description Category path from root to target category
type CategoryPathResponse struct {
	Path []CategoryResponse `json:"path"`
} // @name CategoryPathResponse

// NullableUUID is a custom type to handle "null" string in query parameters
type NullableUUID struct {
	UUID  *uuid.UUID
	IsSet bool
}

// UnmarshalJSON implements json.Unmarshaler to handle "null" strings
func (n *NullableUUID) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}
	
	if s == "null" || s == "" {
		n.UUID = nil
		n.IsSet = true
		return nil
	}
	
	id, err := uuid.Parse(s)
	if err != nil {
		return err
	}
	
	n.UUID = &id
	n.IsSet = true
	return nil
}

// CategoryQueryParams represents query parameters for listing categories
// @Description Query parameters for category listing and filtering
type CategoryQueryParams struct {
	Page     int    `form:"page" example:"1"`
	PageSize int    `form:"page_size" example:"20"`
	Level    *int   `form:"level" binding:"omitempty,min=0,max=5" example:"1"`
	ParentID string `form:"parent_id" example:"550e8400-e29b-41d4-a716-446655440000"`
} // @name CategoryQueryParams

// GetParentID returns the parsed parent ID or nil if "null" or empty
func (p *CategoryQueryParams) GetParentID() *uuid.UUID {
	if p.ParentID == "" || p.ParentID == "null" {
		return nil
	}
	
	if id, err := uuid.Parse(p.ParentID); err == nil {
		return &id
	}
	
	return nil
}

// ToCategoryResponse converts a hierarchy.CategoryNode to CategoryResponse
func ToCategoryResponse(node *hierarchy.CategoryNode, childrenCount int) *CategoryResponse {
	if node == nil || node.Category == nil {
		return nil
	}

	return &CategoryResponse{
		ID:            node.Category.ID,
		Name:          node.Category.Name,
		Description:   node.Category.Description,
		ParentID:      node.Category.ParentID,
		Level:         node.Category.Level,
		Path:          node.Category.Path,
		ChildrenCount: childrenCount,
		CreatedAt:     node.Category.CreatedAt,
		UpdatedAt:     node.Category.UpdatedAt,
	}
}

// ToCategoryHierarchyResponse converts a hierarchy.CategoryNode to CategoryHierarchyResponse
func ToCategoryHierarchyResponse(node *hierarchy.CategoryNode) *CategoryHierarchyResponse {
	if node == nil {
		return nil
	}

	response := &CategoryHierarchyResponse{
		Category: ToCategoryResponse(node, len(node.Children)),
		Children: make([]*CategoryHierarchyResponse, len(node.Children)),
	}

	for i, child := range node.Children {
		response.Children[i] = ToCategoryHierarchyResponse(child)
	}

	return response
}