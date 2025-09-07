package sale

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// Test the core business logic functions that don't need repository mocks
func TestSaleBusinessLogic(t *testing.T) {
	// Create a minimal service instance for testing core logic
	service := &service{}

	t.Run("CalculateItemDiscount", func(t *testing.T) {
		tests := []struct {
			name               string
			baseAmount         float64
			discountPercentage float64
			discountAmount     float64
			expectedDiscount   float64
			expectedTotal      float64
		}{
			{
				name:               "percentage discount only",
				baseAmount:         100.00,
				discountPercentage: 10.0,
				discountAmount:     0.0,
				expectedDiscount:   10.0,
				expectedTotal:      90.0,
			},
			{
				name:               "fixed amount discount only",
				baseAmount:         100.00,
				discountPercentage: 0.0,
				discountAmount:     15.0,
				expectedDiscount:   15.0,
				expectedTotal:      85.0,
			},
			{
				name:               "both percentage and fixed amount",
				baseAmount:         100.00,
				discountPercentage: 10.0,
				discountAmount:     5.0,
				expectedDiscount:   15.0,
				expectedTotal:      85.0,
			},
			{
				name:               "no discount",
				baseAmount:         100.00,
				discountPercentage: 0.0,
				discountAmount:     0.0,
				expectedDiscount:   0.0,
				expectedTotal:      100.0,
			},
			{
				name:               "excessive discount - should not go negative",
				baseAmount:         50.00,
				discountPercentage: 50.0,
				discountAmount:     50.0,
				expectedDiscount:   50.0,
				expectedTotal:      0.0,
			},
			{
				name:               "invalid percentage - should be ignored",
				baseAmount:         100.00,
				discountPercentage: -10.0,
				discountAmount:     0.0,
				expectedDiscount:   0.0,
				expectedTotal:      100.0,
			},
		}

		for _, tc := range tests {
			t.Run(tc.name, func(t *testing.T) {
				discountAmount, total := service.CalculateItemDiscount(tc.baseAmount, tc.discountPercentage, tc.discountAmount)
				assert.Equal(t, tc.expectedDiscount, discountAmount, "discount amount should match")
				assert.Equal(t, tc.expectedTotal, total, "total should match")
			})
		}
	})

	t.Run("CalculateBillDiscount", func(t *testing.T) {
		discountAmount, total := service.CalculateBillDiscount(100.0, 10.0, 5.0)
		assert.Equal(t, 15.0, discountAmount)
		assert.Equal(t, 85.0, total)
	})

	t.Run("CalculateItemProfit", func(t *testing.T) {
		tests := []struct {
			name           string
			unitCost       float64
			unitPrice      float64
			discountAmount float64
			quantity       float64
			expectedProfit float64
		}{
			{
				name:           "basic profit calculation",
				unitCost:       10.0,
				unitPrice:      15.0,
				discountAmount: 0.0,
				quantity:       2.0,
				expectedProfit: 10.0, // (15*2) - (10*2) = 30 - 20 = 10
			},
			{
				name:           "profit with discount",
				unitCost:       10.0,
				unitPrice:      15.0,
				discountAmount: 5.0,
				quantity:       2.0,
				expectedProfit: 5.0, // (15*2) - 5 - (10*2) = 30 - 5 - 20 = 5
			},
			{
				name:           "no profit scenario",
				unitCost:       15.0,
				unitPrice:      15.0,
				discountAmount: 0.0,
				quantity:       1.0,
				expectedProfit: 0.0,
			},
			{
				name:           "loss scenario - should return 0",
				unitCost:       20.0,
				unitPrice:      15.0,
				discountAmount: 0.0,
				quantity:       1.0,
				expectedProfit: 0.0, // Profit should not be negative
			},
		}

		for _, tc := range tests {
			t.Run(tc.name, func(t *testing.T) {
				profit := service.CalculateItemProfit(tc.unitCost, tc.unitPrice, tc.discountAmount, tc.quantity)
				assert.Equal(t, tc.expectedProfit, profit)
			})
		}
	})
}