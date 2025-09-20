import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Settings,
  Zap,
  Eye,
  Calculator,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { usePOSDiscountStore } from '@/stores/pos/posDiscountStore';
import { usePOSCartStore } from '@/stores/pos/posCartStore';
import type { CartItem } from '@/types/pos/cart';

interface DiscountPanelProps {
  sessionId: string;
  cartItems: CartItem[];
  className?: string;
}

export function DiscountPanel({ sessionId, cartItems, className }: DiscountPanelProps) {
  const [isOptimalDialogOpen, setIsOptimalDialogOpen] = useState(false);
  const [isRulesDialogOpen, setIsRulesDialogOpen] = useState(false);

  const {
    rules,
    isEngineEnabled,
    toggleEngine,
    toggleRule,
    calculateOptimalDiscounts,
    calculateTransactionSummary,
    getActiveRules
  } = usePOSDiscountStore();

  const { applyBillDiscount, sessionDiscounts } = usePOSCartStore();

  const taxRate = 0.08; // 8% tax rate
  const currentBillDiscount = sessionDiscounts[sessionId] || 0;

  // Calculate current transaction summary
  const currentSummary = calculateTransactionSummary(cartItems, currentBillDiscount, taxRate);

  // Calculate optimal discounts
  const optimalSummary = calculateOptimalDiscounts(cartItems, taxRate);

  // Check if optimal discounts would provide better savings
  const optimalIsBetter = optimalSummary.totalDiscounts > currentSummary.totalDiscounts;

  const handleApplyOptimalDiscounts = () => {
    if (optimalSummary.billLevelDiscounts > 0) {
      applyBillDiscount(sessionId, optimalSummary.billLevelDiscounts);
    }
    setIsOptimalDialogOpen(false);
  };

  const activeRules = getActiveRules();

  return (
    <Card className={className}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium">Discount Engine</h3>
            <p className="text-xs text-muted-foreground">
              Smart discount calculations and optimization
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={isEngineEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => toggleEngine(!isEngineEnabled)}
              className="h-6 px-2 text-xs"
            >
              {isEngineEnabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {/* Current Summary */}
          <div className="bg-muted/20 p-3 rounded-lg">
            <h4 className="font-medium text-xs mb-2">Current Transaction</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${currentSummary.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discounts:</span>
                <span className="text-green-600">-${currentSummary.totalDiscounts.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${currentSummary.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>${currentSummary.finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Optimal Discounts Suggestion */}
          {isEngineEnabled && optimalIsBetter && cartItems.length > 0 && (
            <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-medium text-xs">Better Discount Available</span>
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                Save an additional ${(optimalSummary.totalDiscounts - currentSummary.totalDiscounts).toFixed(2)}
              </div>
              <Button
                size="sm"
                className="w-full h-7 text-xs"
                onClick={() => setIsOptimalDialogOpen(true)}
              >
                <Zap className="h-3 w-3 mr-1" />
                Apply Optimal Discounts
              </Button>
            </div>
          )}

          {/* Active Rules Summary */}
          {isEngineEnabled && activeRules.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-xs">Active Rules ({activeRules.length})</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setIsRulesDialogOpen(true)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View All
                </Button>
              </div>

              <div className="space-y-1">
                {activeRules.slice(0, 3).map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between text-xs">
                    <span className="truncate">{rule.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {rule.type === 'percentage' ? `${rule.value}%` : `$${rule.value}`}
                    </Badge>
                  </div>
                ))}
                {activeRules.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center pt-1">
                    +{activeRules.length - 3} more rules
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Engine Status */}
          {!isEngineEnabled && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-xs text-yellow-800">
                  Discount engine is disabled. Enable for automatic optimizations.
                </span>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs"
              disabled={!isEngineEnabled || cartItems.length === 0}
            >
              <Calculator className="h-3 w-3 mr-1" />
              Recalculate
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs"
              disabled={!isEngineEnabled}
            >
              <Settings className="h-3 w-3 mr-1" />
              Settings
            </Button>
          </div>
        </div>

        {/* Optimal Discounts Dialog */}
        <Dialog open={isOptimalDialogOpen} onOpenChange={setIsOptimalDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Optimal Discount Suggestion</DialogTitle>
              <DialogDescription>
                The discount engine found better discount combinations for this transaction.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/20 p-3 rounded">
                  <h4 className="font-medium text-sm mb-2">Current</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Discounts:</span>
                      <span>-${currentSummary.totalDiscounts.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>${currentSummary.finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/10 p-3 rounded">
                  <h4 className="font-medium text-sm mb-2">Optimal</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Discounts:</span>
                      <span className="text-green-600">-${optimalSummary.totalDiscounts.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>${optimalSummary.finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {optimalSummary.appliedRules.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Applied Rules</h4>
                  <div className="space-y-1">
                    {optimalSummary.appliedRules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between text-xs">
                        <span>{rule.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {rule.type === 'percentage' ? `${rule.value}%` : `$${rule.value}`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-green-50 p-3 rounded border border-green-200">
                <div className="flex items-center gap-2 text-green-800">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium text-sm">
                    Additional Savings: ${(optimalSummary.totalDiscounts - currentSummary.totalDiscounts).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOptimalDialogOpen(false)}>
                Keep Current
              </Button>
              <Button onClick={handleApplyOptimalDiscounts}>
                Apply Optimal Discounts
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rules Management Dialog */}
        <Dialog open={isRulesDialogOpen} onOpenChange={setIsRulesDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Discount Rules Management</DialogTitle>
              <DialogDescription>
                Manage automatic discount rules for the POS system.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{rule.name}</span>
                        <Badge variant={rule.type === 'percentage' ? 'default' : 'secondary'}>
                          {rule.type === 'percentage' ? `${rule.value}%` : `$${rule.value}`}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Priority: {rule.priority} • {rule.conditions?.length || 0} condition(s)
                      </div>
                    </div>
                    <Button
                      variant={rule.isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleRule(rule.id, !rule.isActive)}
                      className="h-6 px-2 text-xs"
                    >
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRulesDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}