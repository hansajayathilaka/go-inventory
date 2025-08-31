package handlers

import (
	"net/http"
	"strconv"

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
// @Success 200 {object} dto.PaginatedResponse{data=[]dto.CategoryResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /categories [get]
func (h *CategoryHandler) ListCategories(c *gin.Context) {
	// Manually parse query parameters to handle "null" parent_id
	var params dto.CategoryQueryParams
	
	// Parse page parameter
	if pageStr := c.Query("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil && page > 0 {
			params.Page = page
		} else {
			params.Page = 1
		}
	} else {
		params.Page = 1
	}
	
	// Parse page_size parameter
	if pageSizeStr := c.Query("page_size"); pageSizeStr != "" {
		if pageSize, err := strconv.Atoi(pageSizeStr); err == nil && pageSize > 0 {
			params.PageSize = pageSize
		} else {
			params.PageSize = 20
		}
	} else {
		params.PageSize = 20
	}
	
	// Parse level parameter
	if levelStr := c.Query("level"); levelStr != "" {
		if level, err := strconv.Atoi(levelStr); err == nil && level >= 0 && level <= 5 {
			params.Level = &level
		}
	}
	
	// Parse parent_id parameter (this is the problematic one)
	params.ParentID = c.Query("parent_id")

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
	} else if params.ParentID != "" {
		// Handle parent_id parameter
		if params.ParentID == "null" {
			// Explicitly requested root categories
			categories, err = h.categoryService.GetRootCategories(c.Request.Context())
		} else if parentID := params.GetParentID(); parentID != nil {
			// Valid UUID provided
			categories, err = h.categoryService.GetCategoryChildren(c.Request.Context(), *parentID)
		} else {
			// Invalid UUID format
			c.JSON(http.StatusBadRequest, dto.CreateBaseResponse(
				"INVALID_PARENT_ID",
				"Invalid parent_id format",
				"parent_id must be a valid UUID or 'null'",
			))
			return
		}
	} else {
		categories, err = h.categoryService.ListCategories(c.Request.Context(), params.PageSize, offset)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.CreateBaseResponse(
			"FETCH_FAILED",
			"Failed to fetch categories",
			err.Error(),
		))
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

	// Create standardized pagination
	pagination := dto.CreateStandardPagination(params.Page, params.PageSize, int64(len(categoryResponses)))
	
	// Create standardized list response
	response := dto.CreatePaginatedResponse(
		categoryResponses,
		pagination,
		"Categories retrieved successfully",
	)

	c.JSON(http.StatusOK, response)
}

// CreateCategory godoc
// @Summary Create category
// @Description Create a new category
// @Tags categories
// @Accept json
// @Produce json
// @Param category body dto.CreateCategoryRequest true "Category information"
// @Success 201 {object} dto.BaseResponse{data=dto.CategoryResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 409 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /categories [post]
func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	var req dto.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.CreateBaseResponse(
			"INVALID_REQUEST",
			"Invalid request body",
			err.Error(),
		))
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

		errorCode := "CREATE_FAILED"
		if err == hierarchy.ErrCategoryExists {
			errorCode = "CATEGORY_EXISTS"
		} else if err == hierarchy.ErrInvalidParent {
			errorCode = "INVALID_PARENT"
		} else if err == hierarchy.ErrMaxDepthExceeded {
			errorCode = "MAX_DEPTH_EXCEEDED"
		}

		c.JSON(statusCode, dto.CreateBaseResponse(
			errorCode,
			"Failed to create category",
			err.Error(),
		))
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

	c.JSON(http.StatusCreated, dto.CreateStandardSuccessResponse(
		response,
		"Category created successfully",
	))
}

// GetCategory godoc
// @Summary Get category
// @Description Get category details by ID
// @Tags categories
// @Accept json
// @Produce json
// @Param id path string true "Category ID"
// @Success 200 {object} dto.BaseResponse{data=dto.CategoryResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /categories/{id} [get]
func (h *CategoryHandler) GetCategory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.CreateBaseResponse(
			"INVALID_CATEGORY_ID",
			"Invalid category ID",
			"Category ID must be a valid UUID",
		))
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

	c.JSON(http.StatusOK, dto.CreateStandardSuccessResponse(
		response,
		"Category retrieved successfully",
	))
}

// UpdateCategory godoc
// @Summary Update category
// @Description Update category information
// @Tags categories
// @Accept json
// @Produce json
// @Param id path string true "Category ID"
// @Param category body dto.UpdateCategoryRequest true "Category information"
// @Success 200 {object} dto.BaseResponse{data=dto.CategoryResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 409 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /categories/{id} [put]
func (h *CategoryHandler) UpdateCategory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.CreateBaseResponse(
			"INVALID_CATEGORY_ID",
			"Invalid category ID",
			"Category ID must be a valid UUID",
		))
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

	c.JSON(http.StatusOK, dto.CreateStandardSuccessResponse(
		response,
		"Category updated successfully",
	))
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
		c.JSON(http.StatusBadRequest, dto.CreateBaseResponse(
			"INVALID_CATEGORY_ID",
			"Invalid category ID",
			"Category ID must be a valid UUID",
		))
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

	c.JSON(http.StatusOK, dto.CreateStandardSuccessResponse[interface{}](
		nil,
		"Category deleted successfully",
	))
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
		c.JSON(http.StatusBadRequest, dto.CreateBaseResponse(
			"INVALID_CATEGORY_ID",
			"Invalid category ID",
			"Category ID must be a valid UUID",
		))
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

	c.JSON(http.StatusOK, dto.CreateStandardSuccessResponse(
		childResponses,
		"Category children retrieved successfully",
	))
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

	c.JSON(http.StatusOK, dto.CreateStandardSuccessResponse(
		response,
		"Category hierarchy retrieved successfully",
	))
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
		c.JSON(http.StatusBadRequest, dto.CreateBaseResponse(
			"INVALID_CATEGORY_ID",
			"Invalid category ID",
			"Category ID must be a valid UUID",
		))
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

	c.JSON(http.StatusOK, dto.CreateStandardSuccessResponse(
		response,
		"Category path retrieved successfully",
	))
}

// MoveCategory godoc
// @Summary Move category
// @Description Move a category to a different parent (or root level)
// @Tags categories
// @Accept json
// @Produce json
// @Param id path string true "Category ID"
// @Param move body dto.MoveCategoryRequest true "Move information"
// @Success 200 {object} dto.BaseResponse{data=dto.CategoryResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 409 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /categories/{id}/move [put]
func (h *CategoryHandler) MoveCategory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.CreateBaseResponse(
			"INVALID_CATEGORY_ID",
			"Invalid category ID",
			"Category ID must be a valid UUID",
		))
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

	c.JSON(http.StatusOK, dto.CreateStandardSuccessResponse(
		response,
		"Category moved successfully",
	))
}

// SearchCategories godoc
// @Summary Search categories
// @Description Search categories by name or description
// @Tags categories
// @Accept json
// @Produce json
// @Param q query string true "Search query"
// @Success 200 {object} dto.SuccessResponse{data=dto.CategoryListResponse}
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /categories/search [get]
func (h *CategoryHandler) SearchCategories(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Missing search query",
			Message: "Query parameter 'q' is required",
		})
		return
	}

	if len(query) < 2 {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Query too short",
			Message: "Search query must be at least 2 characters long",
		})
		return
	}

	// Search categories using the hierarchy service
	categories, err := h.categoryService.SearchCategories(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to search categories",
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

	// Create standardized list response for search results
	pagination := dto.CreateStandardPagination(1, len(categoryResponses), int64(len(categoryResponses)))
	standardResponse := dto.CreatePaginatedResponse(
		categoryResponses,
		pagination,
		"Categories searched successfully",
	)

	c.JSON(http.StatusOK, standardResponse)
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

	c.JSON(http.StatusOK, dto.CreateStandardSuccessResponse(
		categoryResponses,
		"Root categories retrieved successfully",
	))
}