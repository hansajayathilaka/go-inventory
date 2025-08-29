package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"inventory-api/internal/api/dto"
	"inventory-api/internal/business/customer"
	"inventory-api/internal/repository/models"
)

// CustomerHandler handles customer-related HTTP requests
type CustomerHandler struct {
	customerService customer.Service
}

// NewCustomerHandler creates a new customer handler
func NewCustomerHandler(customerService customer.Service) *CustomerHandler {
	return &CustomerHandler{
		customerService: customerService,
	}
}

// GetCustomers godoc
// @Summary List customers
// @Description Get a paginated list of customers with optional filtering
// @Tags Customers
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param search query string false "Search by name, code, or email"
// @Param is_active query bool false "Filter by active status"
// @Param city query string false "Filter by city"
// @Param state query string false "Filter by state"
// @Success 200 {object} dto.PaginatedResponse{data=[]dto.CustomerResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /customers [get]
func (h *CustomerHandler) GetCustomers(c *gin.Context) {
	var req dto.CustomerListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid query parameters", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Default values
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.Limit <= 0 {
		req.Limit = 10
	}

	// Calculate offset
	offset := (req.Page - 1) * req.Limit

	// Use search or list based on search parameter
	var customers []*models.Customer
	var err error

	if req.Search != "" {
		customers, err = h.customerService.SearchCustomers(c.Request.Context(), req.Search, req.Limit, offset)
	} else {
		customers, err = h.customerService.ListCustomers(c.Request.Context(), req.Limit, offset)
	}

	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve customers", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	// Filter by active status if specified
	if req.IsActive != nil {
		filteredCustomers := make([]*models.Customer, 0)
		for _, customer := range customers {
			if customer.IsActive == *req.IsActive {
				filteredCustomers = append(filteredCustomers, customer)
			}
		}
		customers = filteredCustomers
	}

	// Convert to response DTOs
	customerResponses := dto.ToCustomerResponseList(customers)

	// Get total count for pagination
	totalCount, err := h.customerService.CountCustomers(c.Request.Context())
	if err != nil {
		totalCount = int64(len(customerResponses))
	}

	// Create pagination info
	pagination := &dto.PaginationInfo{
		Page:       req.Page,
		Limit:      req.Limit,
		Total:      totalCount,
		TotalPages: int((totalCount + int64(req.Limit) - 1) / int64(req.Limit)),
	}

	response := dto.CreatePaginatedResponse(customerResponses, pagination, "Customers retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// GetCustomer godoc
// @Summary Get customer by ID
// @Description Get a specific customer by their ID
// @Tags Customers
// @Accept json
// @Produce json
// @Param id path string true "Customer ID" format(uuid)
// @Success 200 {object} dto.BaseResponse{data=dto.CustomerResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /customers/{id} [get]
func (h *CustomerHandler) GetCustomer(c *gin.Context) {
	idStr := c.Param("id")
	customerID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid customer ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	customerModel, err := h.customerService.GetCustomerByID(c.Request.Context(), customerID)
	if err != nil {
		if errors.Is(err, customer.ErrCustomerNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Customer not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve customer", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	customerResponse := dto.ToCustomerResponse(customerModel)
	response := dto.CreateSuccessResponse(customerResponse, "Customer retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// GetCustomerByCode godoc
// @Summary Get customer by code
// @Description Get a specific customer by their code
// @Tags Customers
// @Accept json
// @Produce json
// @Param code path string true "Customer code" example("JOH001")
// @Success 200 {object} dto.BaseResponse{data=dto.CustomerResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /customers/code/{code} [get]
func (h *CustomerHandler) GetCustomerByCode(c *gin.Context) {
	code := c.Param("code")
	if code == "" {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Customer code is required", "")
		c.JSON(http.StatusBadRequest, response)
		return
	}

	customerModel, err := h.customerService.GetCustomerByCode(c.Request.Context(), code)
	if err != nil {
		if errors.Is(err, customer.ErrCustomerNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Customer not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve customer", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	customerResponse := dto.ToCustomerResponse(customerModel)
	response := dto.CreateSuccessResponse(customerResponse, "Customer retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// CreateCustomer godoc
// @Summary Create a new customer
// @Description Create a new customer with the provided information
// @Tags Customers
// @Accept json
// @Produce json
// @Param customer body dto.CreateCustomerRequest true "Customer creation request"
// @Success 201 {object} dto.BaseResponse{data=dto.CustomerResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 409 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /customers [post]
func (h *CustomerHandler) CreateCustomer(c *gin.Context) {
	var req dto.CreateCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid request data", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Convert DTO to model
	customerModel := req.ToCustomerModel()

	// Create customer via service
	createdCustomer, err := h.customerService.CreateCustomer(c.Request.Context(), customerModel)
	if err != nil {
		if errors.Is(err, customer.ErrCustomerExists) || errors.Is(err, customer.ErrCustomerCodeExists) {
			response := dto.CreateErrorResponse("CONFLICT", "Customer already exists", err.Error())
			c.JSON(http.StatusConflict, response)
		} else if errors.Is(err, customer.ErrInvalidInput) {
			response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid input data", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else {
			response := dto.CreateErrorResponse("INTERNAL_ERROR", "Failed to create customer", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	customerResponse := dto.ToCustomerResponse(createdCustomer)
	response := dto.CreateSuccessResponse(customerResponse, "Customer created successfully")
	c.JSON(http.StatusCreated, response)
}

// UpdateCustomer godoc
// @Summary Update a customer
// @Description Update an existing customer's information
// @Tags Customers
// @Accept json
// @Produce json
// @Param id path string true "Customer ID" format(uuid)
// @Param customer body dto.UpdateCustomerRequest true "Customer update request"
// @Success 200 {object} dto.BaseResponse{data=dto.CustomerResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 409 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /customers/{id} [put]
func (h *CustomerHandler) UpdateCustomer(c *gin.Context) {
	idStr := c.Param("id")
	customerID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid customer ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	var req dto.UpdateCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid request data", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Get existing customer
	existingCustomer, err := h.customerService.GetCustomerByID(c.Request.Context(), customerID)
	if err != nil {
		if errors.Is(err, customer.ErrCustomerNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Customer not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve customer", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Apply updates to existing customer
	req.ApplyToCustomerModel(existingCustomer)

	// Update customer via service
	err = h.customerService.UpdateCustomer(c.Request.Context(), existingCustomer)
	if err != nil {
		if errors.Is(err, customer.ErrCustomerExists) || errors.Is(err, customer.ErrCustomerCodeExists) {
			response := dto.CreateErrorResponse("CONFLICT", "Customer already exists", err.Error())
			c.JSON(http.StatusConflict, response)
		} else if errors.Is(err, customer.ErrInvalidInput) {
			response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid input data", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else {
			response := dto.CreateErrorResponse("INTERNAL_ERROR", "Failed to update customer", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	customerResponse := dto.ToCustomerResponse(existingCustomer)
	response := dto.CreateSuccessResponse(customerResponse, "Customer updated successfully")
	c.JSON(http.StatusOK, response)
}

// DeleteCustomer godoc
// @Summary Delete a customer
// @Description Delete a customer by their ID (soft delete)
// @Tags Customers
// @Accept json
// @Produce json
// @Param id path string true "Customer ID" format(uuid)
// @Success 200 {object} dto.BaseResponse
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /customers/{id} [delete]
func (h *CustomerHandler) DeleteCustomer(c *gin.Context) {
	idStr := c.Param("id")
	customerID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid customer ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err = h.customerService.DeleteCustomer(c.Request.Context(), customerID)
	if err != nil {
		if errors.Is(err, customer.ErrCustomerNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Customer not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("INTERNAL_ERROR", "Failed to delete customer", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	response := dto.CreateSuccessResponse(nil, "Customer deleted successfully")
	c.JSON(http.StatusOK, response)
}

// ActivateCustomer godoc
// @Summary Activate a customer
// @Description Activate a deactivated customer
// @Tags Customers
// @Accept json
// @Produce json
// @Param id path string true "Customer ID" format(uuid)
// @Success 200 {object} dto.BaseResponse{data=dto.CustomerResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /customers/{id}/activate [post]
func (h *CustomerHandler) ActivateCustomer(c *gin.Context) {
	idStr := c.Param("id")
	customerID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid customer ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err = h.customerService.ActivateCustomer(c.Request.Context(), customerID)
	if err != nil {
		if errors.Is(err, customer.ErrCustomerNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Customer not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("INTERNAL_ERROR", "Failed to activate customer", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Get updated customer to return in response
	updatedCustomer, err := h.customerService.GetCustomerByID(c.Request.Context(), customerID)
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve updated customer", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	customerResponse := dto.ToCustomerResponse(updatedCustomer)
	response := dto.CreateSuccessResponse(customerResponse, "Customer activated successfully")
	c.JSON(http.StatusOK, response)
}

// DeactivateCustomer godoc
// @Summary Deactivate a customer
// @Description Deactivate an active customer
// @Tags Customers
// @Accept json
// @Produce json
// @Param id path string true "Customer ID" format(uuid)
// @Success 200 {object} dto.BaseResponse{data=dto.CustomerResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /customers/{id}/deactivate [post]
func (h *CustomerHandler) DeactivateCustomer(c *gin.Context) {
	idStr := c.Param("id")
	customerID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid customer ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err = h.customerService.DeactivateCustomer(c.Request.Context(), customerID)
	if err != nil {
		if errors.Is(err, customer.ErrCustomerNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Customer not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("INTERNAL_ERROR", "Failed to deactivate customer", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Get updated customer to return in response
	updatedCustomer, err := h.customerService.GetCustomerByID(c.Request.Context(), customerID)
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve updated customer", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	customerResponse := dto.ToCustomerResponse(updatedCustomer)
	response := dto.CreateSuccessResponse(customerResponse, "Customer deactivated successfully")
	c.JSON(http.StatusOK, response)
}

// GetActiveCustomers godoc
// @Summary List active customers
// @Description Get all active customers
// @Tags Customers
// @Accept json
// @Produce json
// @Success 200 {object} dto.BaseResponse{data=[]dto.CustomerResponse}
// @Failure 500 {object} dto.BaseResponse
// @Router /customers/active [get]
func (h *CustomerHandler) GetActiveCustomers(c *gin.Context) {
	customers, err := h.customerService.GetActiveCustomers(c.Request.Context())
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve active customers", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	customerResponses := dto.ToCustomerResponseList(customers)
	response := dto.CreateSuccessResponse(customerResponses, "Active customers retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// GenerateCustomerCode godoc
// @Summary Generate customer code
// @Description Generate a unique customer code based on customer name
// @Tags Customers
// @Accept json
// @Produce json
// @Param name query string true "Customer name" example("John Doe")
// @Success 200 {object} dto.BaseResponse{data=string}
// @Failure 400 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /customers/generate-code [get]
func (h *CustomerHandler) GenerateCustomerCode(c *gin.Context) {
	name := c.Query("name")
	if name == "" {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Customer name is required", "")
		c.JSON(http.StatusBadRequest, response)
		return
	}

	code, err := h.customerService.GenerateCustomerCode(c.Request.Context(), name)
	if err != nil {
		response := dto.CreateErrorResponse("INTERNAL_ERROR", "Failed to generate customer code", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	response := dto.CreateSuccessResponse(code, "Customer code generated successfully")
	c.JSON(http.StatusOK, response)
}