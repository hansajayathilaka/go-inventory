package handlers

import (
	"net/http"

	"inventory-api/internal/api/dto"
	"inventory-api/internal/business/hierarchy"
	"inventory-api/internal/repository/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CategoryHandler struct {
	categoryService hierarchy.Service
}

func NewCategoryHandler(categoryService hierarchy.Service) *CategoryHandler {
	return &CategoryHandler{
		categoryService: categoryService,
	}
}

// ListCategories godoc
// @Summary List categories
// @Description Get a paginated list of categories with optional filtering
// @Tags categories
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Items per page" default(20)
// @Param level query int false "Filter by category level (0-5)"
// @Param parent_id query string false "Filter by parent category ID"
// @Success 200 {object} dto.SuccessResponse{data=dto.CategoryListResponse}
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /categories [get]
func (h *CategoryHandler) ListCategories(c *gin.Context) {
	var params dto.CategoryQueryParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid query parameters",
			Message: err.Error(),
		})
		return
	}

	// Set defaults
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 {
		params.PageSize = 20
	}

	offset := (params.Page - 1) * params.PageSize

	var categories []*models.Category
	var err error

	if params.Level != nil {
		categories, err = h.categoryService.GetCategoriesByLevel(c.Request.Context(), *params.Level)
	} else if params.ParentID != nil {
		categories, err = h.categoryService.GetCategoryChildren(c.Request.Context(), *params.ParentID)
	} else {
		categories, err = h.categoryService.ListCategories(c.Request.Context(), params.PageSize, offset)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to fetch categories",
			Message: err.Error(),
		})
		return
	}

	// Convert to response format
	categoryResponses := make([]dto.CategoryResponse, len(categories))
	for i, category := range categories {
		children, _ := h.categoryService.GetCategoryChildren(c.Request.Context(), category.ID)
		childrenCount := len(children)

		categoryResponses[i] = dto.CategoryResponse{
			ID:            category.ID,
			Name:          category.Name,
			Description:   category.Description,
			ParentID:      category.ParentID,
			Level:         category.Level,
			Path:          category.Path,
			ChildrenCount: childrenCount,
			CreatedAt:     category.CreatedAt,
			UpdatedAt:     category.UpdatedAt,
		}
	}

	response := dto.CategoryListResponse{
		Categories: categoryResponses,
		Pagination: dto.PaginationResponse{
			Page:     params.Page,
			PageSize: params.PageSize,
			Total:    len(categoryResponses),
		},
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Message: "Categories retrieved successfully",
		Data:    response,
	})
}

// CreateCategory godoc
// @Summary Create category
// @Description Create a new category
// @Tags categories
// @Accept json
// @Produce json
// @Param category body dto.CreateCategoryRequest true "Category information"
// @Success 201 {object} dto.SuccessResponse{data=dto.CategoryResponse}
// @Failure 400 {object} dto.ErrorResponse
// @Failure 409 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /categories [post]
func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	var req dto.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request body",
			Message: err.Error(),
		})
		return
	}

	category, err := h.categoryService.CreateCategory(c.Request.Context(), req.Name, req.Description, req.ParentID)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err == hierarchy.ErrCategoryExists {
			statusCode = http.StatusConflict
		} else if err == hierarchy.ErrInvalidParent || err == hierarchy.ErrMaxDepthExceeded {
			statusCode = http.StatusBadRequest
		}

		c.JSON(statusCode, dto.ErrorResponse{
			Error:   "Failed to create category",
			Message: err.Error(),
		})
		return
	}

	// Get children count
	children, _ := h.categoryService.GetCategoryChildren(c.Request.Context(), category.ID)
	childrenCount := len(children)

	response := dto.CategoryResponse{
		ID:            category.ID,
		Name:          category.Name,
		Description:   category.Description,
		ParentID:      category.ParentID,
		Level:         category.Level,
		Path:          category.Path,
		ChildrenCount: childrenCount,
		CreatedAt:     category.CreatedAt,
		UpdatedAt:     category.UpdatedAt,
	}

	c.JSON(http.StatusCreated, dto.SuccessResponse{
		Message: "Category created successfully",
		Data:    response,
	})
}

// GetCategory godoc
// @Summary Get category
// @Description Get category details by ID
// @Tags categories
// @Accept json
// @Produce json
// @Param id path string true "Category ID"
// @Success 200 {object} dto.SuccessResponse{data=dto.CategoryResponse}
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /categories/{id} [get]
func (h *CategoryHandler) GetCategory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid category ID",
			Message: "Category ID must be a valid UUID",
		})
		return
	}

	category, err := h.categoryService.GetCategoryByID(c.Request.Context(), id)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err == hierarchy.ErrCategoryNotFound {
			statusCode = http.StatusNotFound
		}

		c.JSON(statusCode, dto.ErrorResponse{
			Error:   "Failed to get category",
			Message: err.Error(),
		})
		return
	}

	// Get children count
	children, _ := h.categoryService.GetCategoryChildren(c.Request.Context(), category.ID)
	childrenCount := len(children)

	response := dto.CategoryResponse{
		ID:            category.ID,
		Name:          category.Name,
		Description:   category.Description,
		ParentID:      category.ParentID,
		Level:         category.Level,
		Path:          category.Path,
		ChildrenCount: childrenCount,
		CreatedAt:     category.CreatedAt,
		UpdatedAt:     category.UpdatedAt,
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Message: "Category retrieved successfully",
		Data:    response,
	})
}

// UpdateCategory godoc
// @Summary Update category
// @Description Update category information
// @Tags categories
// @Accept json
// @Produce json
// @Param id path string true "Category ID"
// @Param category body dto.UpdateCategoryRequest true "Category information"
// @Success 200 {object} dto.SuccessResponse{data=dto.CategoryResponse}
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 409 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /categories/{id} [put]
func (h *CategoryHandler) UpdateCategory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid category ID",
			Message: "Category ID must be a valid UUID",
		})
		return
	}

	var req dto.UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request body",
			Message: err.Error(),
		})
		return
	}

	// Get existing category
	category, err := h.categoryService.GetCategoryByID(c.Request.Context(), id)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err == hierarchy.ErrCategoryNotFound {
			statusCode = http.StatusNotFound
		}

		c.JSON(statusCode, dto.ErrorResponse{
			Error:   "Failed to get category",
			Message: err.Error(),
		})
		return
	}

	// Update fields
	category.Name = req.Name
	category.Description = req.Description

	err = h.categoryService.UpdateCategory(c.Request.Context(), category)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err == hierarchy.ErrCategoryExists {
			statusCode = http.StatusConflict
		} else if err == hierarchy.ErrCategoryNotFound {
			statusCode = http.StatusNotFound
		}

		c.JSON(statusCode, dto.ErrorResponse{
			Error:   "Failed to update category",
			Message: err.Error(),
		})
		return
	}

	// Get children count
	children, _ := h.categoryService.GetCategoryChildren(c.Request.Context(), category.ID)
	childrenCount := len(children)

	response := dto.CategoryResponse{
		ID:            category.ID,
		Name:          category.Name,
		Description:   category.Description,
		ParentID:      category.ParentID,
		Level:         category.Level,
		Path:          category.Path,
		ChildrenCount: childrenCount,
		CreatedAt:     category.CreatedAt,
		UpdatedAt:     category.UpdatedAt,
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Message: "Category updated successfully",
		Data:    response,
	})
}

// DeleteCategory godoc
// @Summary Delete category
// @Description Delete a category (must not have products or subcategories)
// @Tags categories
// @Accept json
// @Produce json
// @Param id path string true "Category ID"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 409 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /categories/{id} [delete]
func (h *CategoryHandler) DeleteCategory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid category ID",
			Message: "Category ID must be a valid UUID",
		})
		return
	}

	err = h.categoryService.DeleteCategory(c.Request.Context(), id)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err == hierarchy.ErrCategoryNotFound {
			statusCode = http.StatusNotFound
		} else if err == hierarchy.ErrCategoryHasProducts {
			statusCode = http.StatusConflict
		}

		c.JSON(statusCode, dto.ErrorResponse{
			Error:   "Failed to delete category",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Message: "Category deleted successfully",
	})
}

// GetCategoryChildren godoc
// @Summary Get category children
// @Description Get all child categories of a category
// @Tags categories
// @Accept json
// @Produce json
// @Param id path string true "Category ID"
// @Success 200 {object} dto.SuccessResponse{data=[]dto.CategoryResponse}
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /categories/{id}/children [get]
func (h *CategoryHandler) GetCategoryChildren(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid category ID",
			Message: "Category ID must be a valid UUID",
		})
		return
	}

	// Verify parent exists
	_, err = h.categoryService.GetCategoryByID(c.Request.Context(), id)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err == hierarchy.ErrCategoryNotFound {
			statusCode = http.StatusNotFound
		}

		c.JSON(statusCode, dto.ErrorResponse{
			Error:   "Failed to get category",
			Message: err.Error(),
		})
		return
	}

	children, err := h.categoryService.GetCategoryChildren(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get category children",
			Message: err.Error(),
		})
		return
	}

	// Convert to response format
	childResponses := make([]dto.CategoryResponse, len(children))
	for i, child := range children {
		grandchildren, _ := h.categoryService.GetCategoryChildren(c.Request.Context(), child.ID)
		childrenCount := len(grandchildren)

		childResponses[i] = dto.CategoryResponse{
			ID:            child.ID,
			Name:          child.Name,
			Description:   child.Description,
			ParentID:      child.ParentID,
			Level:         child.Level,
			Path:          child.Path,
			ChildrenCount: childrenCount,
			CreatedAt:     child.CreatedAt,
			UpdatedAt:     child.UpdatedAt,
		}
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Message: "Category children retrieved successfully",
		Data:    childResponses,
	})
}

// GetCategoryHierarchy godoc
// @Summary Get category hierarchy
// @Description Get the complete hierarchical tree of categories from a root category
// @Tags categories
// @Accept json
// @Produce json
// @Param id path string false "Root category ID (optional, if not provided returns all root categories)"
// @Success 200 {object} dto.SuccessResponse{data=dto.CategoryHierarchyResponse}
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /categories/hierarchy [get]
// @Router /categories/{id}/hierarchy [get]
func (h *CategoryHandler) GetCategoryHierarchy(c *gin.Context) {
	var rootID *uuid.UUID
	
	idStr := c.Param("id")
	if idStr != "" {
		id, err := uuid.Parse(idStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Error:   "Invalid category ID",
				Message: "Category ID must be a valid UUID",
			})
			return
		}
		rootID = &id
	}

	hierarchyTree, err := h.categoryService.GetCategoryHierarchy(c.Request.Context(), rootID)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err == hierarchy.ErrCategoryNotFound {
			statusCode = http.StatusNotFound
		}

		c.JSON(statusCode, dto.ErrorResponse{
			Error:   "Failed to get category hierarchy",
			Message: err.Error(),
		})
		return
	}

	response := dto.ToCategoryHierarchyResponse(hierarchyTree)

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Message: "Category hierarchy retrieved successfully",
		Data:    response,
	})
}

// GetCategoryPath godoc
// @Summary Get category path
// @Description Get the path from root to the specified category
// @Tags categories
// @Accept json
// @Produce json
// @Param id path string true "Category ID"
// @Success 200 {object} dto.SuccessResponse{data=dto.CategoryPathResponse}
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /categories/{id}/path [get]
func (h *CategoryHandler) GetCategoryPath(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid category ID",
			Message: "Category ID must be a valid UUID",
		})
		return
	}

	path, err := h.categoryService.GetCategoryPath(c.Request.Context(), id)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err == hierarchy.ErrCategoryNotFound {
			statusCode = http.StatusNotFound
		}

		c.JSON(statusCode, dto.ErrorResponse{
			Error:   "Failed to get category path",
			Message: err.Error(),
		})
		return
	}

	// Convert to response format
	pathResponses := make([]dto.CategoryResponse, len(path))
	for i, category := range path {
		children, _ := h.categoryService.GetCategoryChildren(c.Request.Context(), category.ID)
		childrenCount := len(children)

		pathResponses[i] = dto.CategoryResponse{
			ID:            category.ID,
			Name:          category.Name,
			Description:   category.Description,
			ParentID:      category.ParentID,
			Level:         category.Level,
			Path:          category.Path,
			ChildrenCount: childrenCount,
			CreatedAt:     category.CreatedAt,
			UpdatedAt:     category.UpdatedAt,
		}
	}

	response := dto.CategoryPathResponse{
		Path: pathResponses,
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Message: "Category path retrieved successfully",
		Data:    response,
	})
}

// MoveCategory godoc
// @Summary Move category
// @Description Move a category to a different parent (or root level)
// @Tags categories
// @Accept json
// @Produce json
// @Param id path string true "Category ID"
// @Param move body dto.MoveCategoryRequest true "Move information"
// @Success 200 {object} dto.SuccessResponse{data=dto.CategoryResponse}
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 409 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /categories/{id}/move [put]
func (h *CategoryHandler) MoveCategory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid category ID",
			Message: "Category ID must be a valid UUID",
		})
		return
	}

	var req dto.MoveCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request body",
			Message: err.Error(),
		})
		return
	}

	err = h.categoryService.MoveCategory(c.Request.Context(), id, req.NewParentID)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err == hierarchy.ErrCategoryNotFound {
			statusCode = http.StatusNotFound
		} else if err == hierarchy.ErrInvalidParent || err == hierarchy.ErrCircularReference || err == hierarchy.ErrMaxDepthExceeded {
			statusCode = http.StatusBadRequest
		}

		c.JSON(statusCode, dto.ErrorResponse{
			Error:   "Failed to move category",
			Message: err.Error(),
		})
		return
	}

	// Get updated category
	category, err := h.categoryService.GetCategoryByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get updated category",
			Message: err.Error(),
		})
		return
	}

	// Get children count
	children, _ := h.categoryService.GetCategoryChildren(c.Request.Context(), category.ID)
	childrenCount := len(children)

	response := dto.CategoryResponse{
		ID:            category.ID,
		Name:          category.Name,
		Description:   category.Description,
		ParentID:      category.ParentID,
		Level:         category.Level,
		Path:          category.Path,
		ChildrenCount: childrenCount,
		CreatedAt:     category.CreatedAt,
		UpdatedAt:     category.UpdatedAt,
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Message: "Category moved successfully",
		Data:    response,
	})
}

// GetRootCategories godoc
// @Summary Get root categories
// @Description Get all root-level categories (categories with no parent)
// @Tags categories
// @Accept json
// @Produce json
// @Success 200 {object} dto.SuccessResponse{data=[]dto.CategoryResponse}
// @Failure 500 {object} dto.ErrorResponse
// @Router /categories/roots [get]
func (h *CategoryHandler) GetRootCategories(c *gin.Context) {
	categories, err := h.categoryService.GetRootCategories(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get root categories",
			Message: err.Error(),
		})
		return
	}

	// Convert to response format
	categoryResponses := make([]dto.CategoryResponse, len(categories))
	for i, category := range categories {
		children, _ := h.categoryService.GetCategoryChildren(c.Request.Context(), category.ID)
		childrenCount := len(children)

		categoryResponses[i] = dto.CategoryResponse{
			ID:            category.ID,
			Name:          category.Name,
			Description:   category.Description,
			ParentID:      category.ParentID,
			Level:         category.Level,
			Path:          category.Path,
			ChildrenCount: childrenCount,
			CreatedAt:     category.CreatedAt,
			UpdatedAt:     category.UpdatedAt,
		}
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Message: "Root categories retrieved successfully",
		Data:    categoryResponses,
	})
}