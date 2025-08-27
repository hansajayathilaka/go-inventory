package handlers

import (
	"fmt"
	"net/http"

	"inventory-api/internal/business/hierarchy"
	"inventory-api/internal/web/components"
	"inventory-api/internal/web/layouts"
	"inventory-api/internal/web/types"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CategoryWebHandler struct {
	categoryService hierarchy.Service
}

func NewCategoryWebHandler(categoryService hierarchy.Service) *CategoryWebHandler {
	return &CategoryWebHandler{
		categoryService: categoryService,
	}
}

// CategoriesPage renders the main categories management page
func (h *CategoryWebHandler) CategoriesPage(c *gin.Context) {
	// Get user from session context (placeholder for now)
	user := map[string]interface{}{"name": "User"}
	
	c.Header("Content-Type", "text/html")
	layouts.Dashboard("Categories", user).Render(c.Request.Context(), c.Writer)
}

// CategoryTree returns the hierarchical category tree as HTML
func (h *CategoryWebHandler) CategoryTree(c *gin.Context) {
	categories, err := h.categoryService.GetRootCategories(c.Request.Context())
	if err != nil {
		c.HTML(http.StatusInternalServerError, "", gin.H{
			"error": "Failed to load categories",
		})
		return
	}

	// Convert to tree structure
	treeNodes := make([]types.CategoryTreeNode, len(categories))
	for i, cat := range categories {
		children, _ := h.categoryService.GetCategoryChildren(c.Request.Context(), cat.ID)
		treeNodes[i] = types.CategoryTreeNode{
			ID:            cat.ID.String(),
			Name:          cat.Name,
			Description:   cat.Description,
			Level:         cat.Level,
			ChildrenCount: len(children),
			HasChildren:   len(children) > 0,
		}
	}

	c.Header("Content-Type", "text/html")
	components.CategoryTreeNodes(treeNodes).Render(c.Request.Context(), c.Writer)
}

// LoadCategoryChildren loads children of a specific category
func (h *CategoryWebHandler) LoadCategoryChildren(c *gin.Context) {
	categoryID := c.Param("id")
	id, err := uuid.Parse(categoryID)
	if err != nil {
		c.String(http.StatusBadRequest, "Invalid category ID")
		return
	}

	children, err := h.categoryService.GetCategoryChildren(c.Request.Context(), id)
	if err != nil {
		c.String(http.StatusInternalServerError, "Failed to load children")
		return
	}

	// Convert to tree structure
	treeNodes := make([]types.CategoryTreeNode, len(children))
	for i, child := range children {
		grandchildren, _ := h.categoryService.GetCategoryChildren(c.Request.Context(), child.ID)
		treeNodes[i] = types.CategoryTreeNode{
			ID:            child.ID.String(),
			Name:          child.Name,
			Description:   child.Description,
			Level:         child.Level,
			ChildrenCount: len(grandchildren),
			HasChildren:   len(grandchildren) > 0,
		}
	}

	c.Header("Content-Type", "text/html")
	components.CategoryTreeNodes(treeNodes).Render(c.Request.Context(), c.Writer)
}

// CreateCategoryForm renders the create category form
func (h *CategoryWebHandler) CreateCategoryForm(c *gin.Context) {
	parentID := c.Query("parent_id")
	var parentName string
	
	if parentID != "" {
		if id, err := uuid.Parse(parentID); err == nil {
			if parent, err := h.categoryService.GetCategoryByID(c.Request.Context(), id); err == nil {
				parentName = parent.Name
			}
		}
	}

	c.Header("Content-Type", "text/html")
	components.CreateCategoryForm(parentID, parentName).Render(c.Request.Context(), c.Writer)
}

// CategorySelector renders a category selector dropdown
func (h *CategoryWebHandler) CategorySelector(c *gin.Context) {
	// Get all root categories for the dropdown
	categories, err := h.categoryService.GetRootCategories(c.Request.Context())
	if err != nil {
		c.String(http.StatusInternalServerError, "Failed to load categories")
		return
	}

	c.Header("Content-Type", "text/html")
	
	// Build select options
	html := `<select id="parent_id" name="parent_id" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
		<option value="">No Parent (Root Category)</option>`
	
	for _, category := range categories {
		html += fmt.Sprintf(`<option value="%s">%s</option>`, category.ID.String(), category.Name)
	}
	html += `</select>`
	
	c.Data(http.StatusOK, "text/html", []byte(html))
}

// CreateCategory handles category creation
func (h *CategoryWebHandler) CreateCategory(c *gin.Context) {
	name := c.PostForm("name")
	description := c.PostForm("description")
	parentIDStr := c.PostForm("parent_id")

	if name == "" {
		c.Header("HX-Retarget", "#category-form")
		c.Header("HX-Reswap", "innerHTML")
		c.HTML(http.StatusBadRequest, "", gin.H{
			"error": "Category name is required",
		})
		return
	}

	var parentID *uuid.UUID
	if parentIDStr != "" {
		id, err := uuid.Parse(parentIDStr)
		if err != nil {
			c.Header("HX-Retarget", "#category-form")
			c.Header("HX-Reswap", "innerHTML")
			c.HTML(http.StatusBadRequest, "", gin.H{
				"error": "Invalid parent category ID",
			})
			return
		}
		parentID = &id
	}

	_, err := h.categoryService.CreateCategory(c.Request.Context(), name, description, parentID)
	if err != nil {
		c.Header("HX-Retarget", "#category-form")
		c.Header("HX-Reswap", "innerHTML")
		c.HTML(http.StatusBadRequest, "", gin.H{
			"error": err.Error(),
		})
		return
	}

	// Success - trigger tree refresh and close modal
	c.Header("HX-Trigger", "categoryCreated")
	c.String(http.StatusOK, "")
}

// EditCategoryForm renders the edit category form
func (h *CategoryWebHandler) EditCategoryForm(c *gin.Context) {
	categoryID := c.Param("id")
	id, err := uuid.Parse(categoryID)
	if err != nil {
		c.String(http.StatusBadRequest, "Invalid category ID")
		return
	}

	category, err := h.categoryService.GetCategoryByID(c.Request.Context(), id)
	if err != nil {
		c.String(http.StatusNotFound, "Category not found")
		return
	}

	c.Header("Content-Type", "text/html")
	components.EditCategoryForm(category.ID.String(), category.Name, category.Description).Render(c.Request.Context(), c.Writer)
}

// UpdateCategory handles category updates
func (h *CategoryWebHandler) UpdateCategory(c *gin.Context) {
	categoryID := c.Param("id")
	id, err := uuid.Parse(categoryID)
	if err != nil {
		c.String(http.StatusBadRequest, "Invalid category ID")
		return
	}

	name := c.PostForm("name")
	description := c.PostForm("description")

	if name == "" {
		c.Header("HX-Retarget", "#category-form")
		c.Header("HX-Reswap", "innerHTML")
		c.HTML(http.StatusBadRequest, "", gin.H{
			"error": "Category name is required",
		})
		return
	}

	category, err := h.categoryService.GetCategoryByID(c.Request.Context(), id)
	if err != nil {
		c.Header("HX-Retarget", "#category-form")
		c.Header("HX-Reswap", "innerHTML")
		c.HTML(http.StatusNotFound, "", gin.H{
			"error": "Category not found",
		})
		return
	}

	category.Name = name
	category.Description = description

	err = h.categoryService.UpdateCategory(c.Request.Context(), category)
	if err != nil {
		c.Header("HX-Retarget", "#category-form")
		c.Header("HX-Reswap", "innerHTML")
		c.HTML(http.StatusBadRequest, "", gin.H{
			"error": err.Error(),
		})
		return
	}

	// Success - trigger tree refresh and close modal
	c.Header("HX-Trigger", "categoryUpdated")
	c.String(http.StatusOK, "")
}

// DeleteCategory handles category deletion
func (h *CategoryWebHandler) DeleteCategory(c *gin.Context) {
	categoryID := c.Param("id")
	id, err := uuid.Parse(categoryID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	err = h.categoryService.DeleteCategory(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Success - trigger tree refresh
	c.Header("HX-Trigger", "categoryDeleted")
	c.String(http.StatusOK, "")
}

