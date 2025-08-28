package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"inventory-api/internal/api/dto"
	"inventory-api/internal/business/inventory"
	productBusiness "inventory-api/internal/business/product"
	"inventory-api/internal/repository/models"
)

type ProductHandler struct {
	productService   productBusiness.Service
	inventoryService inventory.Service
}

func NewProductHandler(productService productBusiness.Service, inventoryService inventory.Service) *ProductHandler {
	return &ProductHandler{
		productService:   productService,
		inventoryService: inventoryService,
	}
}

// CreateProduct godoc
// @Summary Create a new product
// @Description Create a new product in the system
// @Tags products
// @Accept json
// @Produce json
// @Param product body dto.ProductCreateRequest true "Product creation data"
// @Success 201 {object} dto.ApiResponse{data=dto.ProductResponse} "Product created successfully"
// @Failure 400 {object} dto.ErrorResponse "Invalid request"
// @Failure 409 {object} dto.ErrorResponse "Product already exists"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Router /products [post]
func (h *ProductHandler) CreateProduct(c *gin.Context) {
	var req dto.ProductCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	// Convert request to model
	product := &models.Product{
		SKU:            req.SKU,
		Name:           req.Name,
		Description:    req.Description,
		CategoryID:     req.CategoryID,
		SupplierID:     req.SupplierID,
		CostPrice:      req.CostPrice,
		RetailPrice:    req.RetailPrice,
		WholesalePrice: req.WholesalePrice,
		Barcode:        req.Barcode,
		Weight:         req.Weight,
		Dimensions:     req.Dimensions,
		IsActive:       req.IsActive != nil && *req.IsActive,
	}

	if req.IsActive == nil {
		product.IsActive = true // Default to active
	}

	if err := h.productService.CreateProduct(c.Request.Context(), product); err != nil {
		if errors.Is(err, productBusiness.ErrSKUExists) {
			c.JSON(http.StatusConflict, dto.ErrorResponse{
				Error:   "Product exists",
				Message: "A product with this SKU already exists",
			})
			return
		}
		if errors.Is(err, productBusiness.ErrBarcodeExists) {
			c.JSON(http.StatusConflict, dto.ErrorResponse{
				Error:   "Barcode exists",
				Message: "A product with this barcode already exists",
			})
			return
		}
		if errors.Is(err, productBusiness.ErrInvalidProduct) || errors.Is(err, productBusiness.ErrCategoryNotFound) || errors.Is(err, productBusiness.ErrSupplierNotFound) {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Error:   "Invalid data",
				Message: err.Error(),
			})
			return
		}

		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to create product",
			Message: err.Error(),
		})
		return
	}

	response := h.convertToResponse(product)
	c.JSON(http.StatusCreated, dto.ApiResponse{
		Success: true,
		Message: "Product created successfully",
		Data:    response,
	})
}

// GetProducts godoc
// @Summary List products
// @Description Get a paginated list of products with optional filtering
// @Tags products
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param per_page query int false "Items per page" default(20)
// @Param category_id query string false "Filter by category ID"
// @Param supplier_id query string false "Filter by supplier ID"
// @Param is_active query boolean false "Filter by active status"
// @Success 200 {object} dto.ApiResponse{data=dto.ProductListResponse} "Products retrieved successfully"
// @Failure 400 {object} dto.ErrorResponse "Invalid parameters"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Router /products [get]
func (h *ProductHandler) GetProducts(c *gin.Context) {
	page := 1
	perPage := 20

	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	if p := c.Query("per_page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 && parsed <= 100 {
			perPage = parsed
		}
	}
	if p := c.Query("limit"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 && parsed <= 100 {
			perPage = parsed
		}
	}

	offset := (page - 1) * perPage

	var products []*models.Product
	var err error

	// Check for search parameter first
	if searchTerm := c.Query("search"); searchTerm != "" {
		products, err = h.productService.SearchProducts(c.Request.Context(), searchTerm, perPage, offset)
	} else if categoryIDStr := c.Query("category_id"); categoryIDStr != "" {
		categoryID, parseErr := uuid.Parse(categoryIDStr)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Error:   "Invalid category ID",
				Message: parseErr.Error(),
			})
			return
		}
		products, err = h.productService.GetProductsByCategory(c.Request.Context(), categoryID)
	} else if supplierIDStr := c.Query("supplier_id"); supplierIDStr != "" {
		supplierID, parseErr := uuid.Parse(supplierIDStr)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Error:   "Invalid supplier ID",
				Message: parseErr.Error(),
			})
			return
		}
		products, err = h.productService.GetProductsBySupplier(c.Request.Context(), supplierID)
	} else if statusStr := c.Query("status"); statusStr == "active" {
		products, err = h.productService.GetActiveProducts(c.Request.Context())
	} else if statusStr := c.Query("status"); statusStr == "inactive" {
		// Get all products and filter out active ones
		allProducts, getAllErr := h.productService.ListProducts(c.Request.Context(), 1000, 0)
		if getAllErr != nil {
			err = getAllErr
		} else {
			products = make([]*models.Product, 0)
			for _, p := range allProducts {
				if !p.IsActive {
					products = append(products, p)
				}
			}
		}
	} else {
		products, err = h.productService.ListProducts(c.Request.Context(), perPage, offset)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to fetch products",
			Message: err.Error(),
		})
		return
	}

	total, err := h.productService.CountProducts(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to count products",
			Message: err.Error(),
		})
		return
	}

	response := dto.ProductListResponse{
		Products:   h.convertToResponseList(products),
		Total:      total,
		Page:       page,
		PerPage:    perPage,
		TotalPages: int((total + int64(perPage) - 1) / int64(perPage)),
	}

	c.JSON(http.StatusOK, dto.ApiResponse{
		Success: true,
		Message: "Products retrieved successfully",
		Data:    response,
	})
}

// GetProduct godoc
// @Summary Get product by ID
// @Description Get a specific product by its ID
// @Tags products
// @Accept json
// @Produce json
// @Param id path string true "Product ID"
// @Success 200 {object} dto.ApiResponse{data=dto.ProductResponse} "Product retrieved successfully"
// @Failure 400 {object} dto.ErrorResponse "Invalid product ID"
// @Failure 404 {object} dto.ErrorResponse "Product not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Router /products/{id} [get]
func (h *ProductHandler) GetProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid product ID",
			Message: err.Error(),
		})
		return
	}

	product, err := h.productService.GetProduct(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, productBusiness.ErrProductNotFound) {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{
				Error:   "Product not found",
				Message: err.Error(),
			})
			return
		}

		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to fetch product",
			Message: err.Error(),
		})
		return
	}

	response := h.convertToResponse(product)
	
	// Add inventory information
	if inventoryList, err := h.inventoryService.GetInventoryByProduct(c.Request.Context(), product.ID); err == nil {
		response.Inventory = h.convertInventoryToResponse(inventoryList)
		
		// Calculate total stock
		totalStock := 0
		for _, inv := range inventoryList {
			totalStock += inv.Quantity
		}
		response.TotalStock = &totalStock
	}

	c.JSON(http.StatusOK, dto.ApiResponse{
		Success: true,
		Message: "Product retrieved successfully",
		Data:    response,
	})
}

// UpdateProduct godoc
// @Summary Update product
// @Description Update an existing product
// @Tags products
// @Accept json
// @Produce json
// @Param id path string true "Product ID"
// @Param product body dto.ProductUpdateRequest true "Product update data"
// @Success 200 {object} dto.ApiResponse{data=dto.ProductResponse} "Product updated successfully"
// @Failure 400 {object} dto.ErrorResponse "Invalid request"
// @Failure 404 {object} dto.ErrorResponse "Product not found"
// @Failure 409 {object} dto.ErrorResponse "Conflict with existing data"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Router /products/{id} [put]
func (h *ProductHandler) UpdateProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid product ID",
			Message: err.Error(),
		})
		return
	}

	var req dto.ProductUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	// Get existing product
	product, err := h.productService.GetProduct(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, productBusiness.ErrProductNotFound) {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{
				Error:   "Product not found",
				Message: err.Error(),
			})
			return
		}

		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to fetch product",
			Message: err.Error(),
		})
		return
	}

	// Update fields if provided
	if req.Name != nil {
		product.Name = *req.Name
	}
	if req.Description != nil {
		product.Description = *req.Description
	}
	if req.CategoryID != nil {
		product.CategoryID = *req.CategoryID
	}
	if req.SupplierID != nil {
		product.SupplierID = req.SupplierID
	}
	if req.CostPrice != nil {
		product.CostPrice = *req.CostPrice
	}
	if req.RetailPrice != nil {
		product.RetailPrice = *req.RetailPrice
	}
	if req.WholesalePrice != nil {
		product.WholesalePrice = *req.WholesalePrice
	}
	if req.Barcode != nil {
		product.Barcode = *req.Barcode
	}
	if req.Weight != nil {
		product.Weight = *req.Weight
	}
	if req.Dimensions != nil {
		product.Dimensions = *req.Dimensions
	}
	if req.IsActive != nil {
		product.IsActive = *req.IsActive
	}

	if err := h.productService.UpdateProduct(c.Request.Context(), product); err != nil {
		if errors.Is(err, productBusiness.ErrSKUExists) {
			c.JSON(http.StatusConflict, dto.ErrorResponse{
				Error:   "SKU exists",
				Message: "Another product with this SKU already exists",
			})
			return
		}
		if errors.Is(err, productBusiness.ErrBarcodeExists) {
			c.JSON(http.StatusConflict, dto.ErrorResponse{
				Error:   "Barcode exists",
				Message: "Another product with this barcode already exists",
			})
			return
		}
		if errors.Is(err, productBusiness.ErrInvalidProduct) || errors.Is(err, productBusiness.ErrCategoryNotFound) || errors.Is(err, productBusiness.ErrSupplierNotFound) {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Error:   "Invalid data",
				Message: err.Error(),
			})
			return
		}

		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to update product",
			Message: err.Error(),
		})
		return
	}

	response := h.convertToResponse(product)
	c.JSON(http.StatusOK, dto.ApiResponse{
		Success: true,
		Message: "Product updated successfully",
		Data:    response,
	})
}

// DeleteProduct godoc
// @Summary Delete product
// @Description Delete a product from the system
// @Tags products
// @Accept json
// @Produce json
// @Param id path string true "Product ID"
// @Success 200 {object} dto.ApiResponse "Product deleted successfully"
// @Failure 400 {object} dto.ErrorResponse "Invalid product ID"
// @Failure 404 {object} dto.ErrorResponse "Product not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Router /products/{id} [delete]
func (h *ProductHandler) DeleteProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid product ID",
			Message: err.Error(),
		})
		return
	}

	if err := h.productService.DeleteProduct(c.Request.Context(), id); err != nil {
		if errors.Is(err, productBusiness.ErrProductNotFound) {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{
				Error:   "Product not found",
				Message: err.Error(),
			})
			return
		}

		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to delete product",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.ApiResponse{
		Success: true,
		Message: "Product deleted successfully",
	})
}

// SearchProducts godoc
// @Summary Search products
// @Description Search products by name, SKU, or other criteria
// @Tags products
// @Accept json
// @Produce json
// @Param q query string true "Search query"
// @Param page query int false "Page number" default(1)
// @Param per_page query int false "Items per page" default(20)
// @Success 200 {object} dto.ApiResponse{data=dto.ProductListResponse} "Products found"
// @Failure 400 {object} dto.ErrorResponse "Invalid parameters"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Router /products/search [get]
func (h *ProductHandler) SearchProducts(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Missing query",
			Message: "Search query is required",
		})
		return
	}

	page := 1
	perPage := 20

	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	if p := c.Query("per_page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 && parsed <= 100 {
			perPage = parsed
		}
	}

	offset := (page - 1) * perPage

	products, err := h.productService.SearchProducts(c.Request.Context(), query, perPage, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to search products",
			Message: err.Error(),
		})
		return
	}

	// For search, we return the actual count of results found
	total := int64(len(products))

	response := dto.ProductListResponse{
		Products:   h.convertToResponseList(products),
		Total:      total,
		Page:       page,
		PerPage:    perPage,
		TotalPages: int((total + int64(perPage) - 1) / int64(perPage)),
	}

	c.JSON(http.StatusOK, dto.ApiResponse{
		Success: true,
		Message: "Products found",
		Data:    response,
	})
}

// GetProductInventory godoc
// @Summary Get product inventory
// @Description Get inventory information for a specific product across all locations
// @Tags products
// @Accept json
// @Produce json
// @Param id path string true "Product ID"
// @Success 200 {object} dto.ApiResponse{data=[]dto.ProductInventoryResponse} "Product inventory retrieved successfully"
// @Failure 400 {object} dto.ErrorResponse "Invalid product ID"
// @Failure 404 {object} dto.ErrorResponse "Product not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Router /products/{id}/inventory [get]
func (h *ProductHandler) GetProductInventory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid product ID",
			Message: err.Error(),
		})
		return
	}

	// Verify product exists
	_, err = h.productService.GetProduct(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, productBusiness.ErrProductNotFound) {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{
				Error:   "Product not found",
				Message: err.Error(),
			})
			return
		}

		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to fetch product",
			Message: err.Error(),
		})
		return
	}

	inventoryList, err := h.inventoryService.GetInventoryByProduct(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to fetch inventory",
			Message: err.Error(),
		})
		return
	}

	response := h.convertInventoryToResponse(inventoryList)
	c.JSON(http.StatusOK, dto.ApiResponse{
		Success: true,
		Message: "Product inventory retrieved successfully",
		Data:    response,
	})
}

// Helper methods

func (h *ProductHandler) convertToResponse(product *models.Product) dto.ProductResponse {
	response := dto.ProductResponse{
		ID:             product.ID,
		SKU:            product.SKU,
		Name:           product.Name,
		Description:    product.Description,
		CategoryID:     product.CategoryID,
		SupplierID:     product.SupplierID,
		CostPrice:      product.CostPrice,
		RetailPrice:    product.RetailPrice,
		WholesalePrice: product.WholesalePrice,
		Barcode:        product.Barcode,
		Weight:         product.Weight,
		Dimensions:     product.Dimensions,
		IsActive:       product.IsActive,
		CreatedAt:      product.CreatedAt,
		UpdatedAt:      product.UpdatedAt,
	}

	// Include category info if loaded
	if product.Category.ID != uuid.Nil {
		response.Category = &dto.CategoryResponse{
			ID:          product.Category.ID,
			Name:        product.Category.Name,
			Description: product.Category.Description,
			ParentID:    product.Category.ParentID,
			Level:       product.Category.Level,
			Path:        product.Category.Path,
			CreatedAt:   product.Category.CreatedAt,
			UpdatedAt:   product.Category.UpdatedAt,
		}
	}

	// Include supplier info if loaded
	if product.Supplier != nil && product.Supplier.ID != uuid.Nil {
		response.Supplier = &dto.SupplierResponse{
			ID:       product.Supplier.ID,
			Name:     product.Supplier.Name,
			Code:     product.Supplier.Code,
			Email:    product.Supplier.Email,
			Phone:    product.Supplier.Phone,
			IsActive: product.Supplier.IsActive,
		}
	}

	return response
}

func (h *ProductHandler) convertToResponseList(products []*models.Product) []dto.ProductResponse {
	responses := make([]dto.ProductResponse, len(products))
	for i, product := range products {
		responses[i] = h.convertToResponse(product)
	}
	return responses
}

func (h *ProductHandler) convertInventoryToResponse(inventoryList []*models.Inventory) []dto.ProductInventoryResponse {
	responses := make([]dto.ProductInventoryResponse, len(inventoryList))
	for i, inv := range inventoryList {
		var locationID uuid.UUID
		if inv.LocationID != nil {
			locationID = *inv.LocationID
		}
		
		response := dto.ProductInventoryResponse{
			LocationID:        locationID,
			Quantity:          inv.Quantity,
			ReservedQuantity:  inv.ReservedQuantity,
			AvailableQuantity: inv.AvailableQuantity(),
			ReorderLevel:      inv.ReorderLevel,
			MaxLevel:          inv.MaxLevel,
		}

		// Include location name if loaded
		if inv.LocationID != nil && inv.Location != nil && inv.Location.ID != uuid.Nil {
			response.LocationName = inv.Location.Name
		}

		responses[i] = response
	}
	return responses
}

// POSLookup godoc
// @Summary POS product lookup
// @Description Search products for POS by barcode, SKU, or name
// @Tags pos
// @Accept json
// @Produce json
// @Param q query string true "Search query (barcode, SKU, or name)"
// @Success 200 {object} dto.POSLookupResponse "Products found"
// @Failure 400 {object} dto.ErrorResponse "Invalid query"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Router /pos/lookup [get]
func (h *ProductHandler) POSLookup(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Missing query",
			Message: "Search query is required",
		})
		return
	}

	ctx := c.Request.Context()
	
	// Search products by the query (could be barcode, SKU, or name)
	products, err := h.productService.SearchProducts(ctx, query, 10, 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to search products",
			Message: err.Error(),
		})
		return
	}

	// Convert to POS format with inventory data
	posProducts := make([]dto.POSProduct, 0, len(products))
	for _, product := range products {
		// Get inventory for this product
		inventory, err := h.inventoryService.GetInventoryByProduct(ctx, product.ID)
		if err != nil {
			continue // Skip products with inventory errors
		}

		var totalQuantity int
		for _, inv := range inventory {
			totalQuantity += inv.Quantity
		}

		posProduct := dto.POSProduct{
			ID:          product.ID,
			SKU:         product.SKU,
			Name:        product.Name,
			Barcode:     product.Barcode,
			RetailPrice: product.RetailPrice,
			CostPrice:   product.CostPrice,
			Quantity:    totalQuantity,
			TaxCategory: "standard", // Default tax category for hardware store
			QuickSale:   false,      // Default to false
			IsActive:    product.IsActive,
		}
		
		posProducts = append(posProducts, posProduct)
	}

	response := dto.POSLookupResponse{
		Success: true,
		Message: "Products found successfully",
		Data:    posProducts,
	}

	c.JSON(http.StatusOK, response)
}

// GetPOSReady godoc
// @Summary Get POS-ready products
// @Description Get all active products formatted for POS use
// @Tags pos
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Success 200 {object} dto.ApiResponse{data=[]dto.POSProduct} "POS products"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Router /products/pos-ready [get]
func (h *ProductHandler) GetPOSReady(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit
	ctx := c.Request.Context()

	// Get active products only
	products, err := h.productService.ListProducts(ctx, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to fetch products",
			Message: err.Error(),
		})
		return
	}

	// Filter active products and convert to POS format
	posProducts := make([]dto.POSProduct, 0)
	for _, product := range products {
		if !product.IsActive {
			continue // Skip inactive products
		}

		// Get inventory for this product
		inventory, err := h.inventoryService.GetInventoryByProduct(ctx, product.ID)
		if err != nil {
			continue // Skip products with inventory errors
		}

		var totalQuantity int
		for _, inv := range inventory {
			totalQuantity += inv.Quantity
		}

		posProduct := dto.POSProduct{
			ID:          product.ID,
			SKU:         product.SKU,
			Name:        product.Name,
			Barcode:     product.Barcode,
			RetailPrice: product.RetailPrice,
			CostPrice:   product.CostPrice,
			Quantity:    totalQuantity,
			TaxCategory: "standard",
			QuickSale:   false,
			IsActive:    product.IsActive,
		}
		
		posProducts = append(posProducts, posProduct)
	}

	c.JSON(http.StatusOK, dto.ApiResponse{
		Success: true,
		Message: "POS products retrieved successfully",
		Data:    posProducts,
	})
}