import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingCart,
  CreditCard,
  X
} from 'lucide-react';
import { SessionManager } from './SessionManager';
import { ProductSelection } from './ProductSelection/ProductSelection';
import { LineItemDiscount } from './Discounts/LineItemDiscount';
import { BillDiscountDialog } from './Discounts/BillDiscountDialog';
import { usePOSSessionStore } from '@/stores/pos/posSessionStore';
import { usePOSCartStore } from '@/stores/pos/posCartStore';

interface POSLayoutProps {
  activeSession: string | null;
  onSessionChange: (sessionId: string) => void;
}

export function POSLayout({ activeSession, onSessionChange }: POSLayoutProps) {
  const { getSession } = usePOSSessionStore();
  const { getCartItems, getCartSummary, removeItem, updateItem, applyBillDiscount, sessionDiscounts } = usePOSCartStore();

  const currentSession = activeSession ? getSession(activeSession) : null;

  const handleRemoveFromCart = (itemId: string) => {
    if (!activeSession) return;
    removeItem(activeSession, itemId);
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (!activeSession) return;
    updateItem(activeSession, itemId, { quantity });
  };

  const handleApplyLineDiscount = (itemId: string, discountAmount: number) => {
    if (!activeSession) return;
    updateItem(activeSession, itemId, { lineDiscount: discountAmount });
  };

  const handleApplyBillDiscount = (discountAmount: number, reason?: string) => {
    if (!activeSession) return;
    applyBillDiscount(activeSession, discountAmount);
    // Note: reason can be stored for audit purposes in future implementation
    if (reason) {
      console.log(`Bill discount applied: $${discountAmount.toFixed(2)} - Reason: ${reason}`);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Session Management */}
      <div className="border-b bg-card">
        <SessionManager
          activeSessionId={activeSession}
          onSessionChange={onSessionChange}
        />
      </div>

      {/* Main POS Interface */}
      {!activeSession || !currentSession ? (
        <div className="flex-1 flex items-center justify-center bg-muted/20">
          <div className="text-center">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No Active Session</h2>
            <p className="text-muted-foreground mb-4">Create a new session to start a transaction</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex min-h-0">
          <Tabs value={activeSession} onValueChange={onSessionChange} className="flex-1 flex flex-col">
            <TabsContent value={activeSession} className="flex-1 m-0 min-h-0">
              <div className="grid grid-cols-12 h-full min-h-0">

                {/* Product Selection Area */}
                <div className="col-span-8 border-r bg-background flex flex-col min-h-0">
                  <ProductSelection
                    activeSessionId={activeSession}
                    onProductSelect={(product) => {
                      // Product is already added to cart by ProductSelection
                      console.log('Product selected:', product.name);
                    }}
                  />
                </div>

                {/* Shopping Cart and Payment Area */}
                <div className="col-span-4 bg-card flex flex-col min-h-0">
                  <div className="h-full flex flex-col min-h-0">
                    {/* Session Info */}
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <h2 className="font-semibold">{currentSession.name}</h2>
                        <Badge
                          variant={currentSession.status === 'active' ? 'default' : 'secondary'}
                        >
                          {currentSession.status}
                        </Badge>
                      </div>
                      {(() => {
                        const summary = getCartSummary(activeSession);
                        return (
                          <p className="text-sm text-muted-foreground">
                            {summary.itemCount} items • ${summary.total.toFixed(2)}
                          </p>
                        );
                      })()}
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 flex flex-col p-4 min-h-0">
                      <h3 className="font-medium mb-3">Cart Items</h3>
                      <div className="flex-1 overflow-y-auto min-h-0">
                        {(() => {
                          const cartItems = getCartItems(activeSession);
                          return cartItems.length > 0 ? (
                            <div className="space-y-3 pr-2">
                              {cartItems.map((item) => (
                                <Card key={item.id} className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-medium text-sm">{item.productName}</h4>
                                      <p className="text-xs text-muted-foreground">{item.productSku}</p>
                                      <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center space-x-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-6 w-6 p-0"
                                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                          >
                                            -
                                          </Button>
                                          <span className="text-sm">{item.quantity}</span>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-6 w-6 p-0"
                                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                          >
                                            +
                                          </Button>
                                        </div>
                                        <LineItemDiscount
                                          item={item}
                                          onApplyDiscount={handleApplyLineDiscount}
                                        />
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold text-sm">${item.lineTotal.toFixed(2)}</p>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive p-0"
                                        onClick={() => handleRemoveFromCart(item.id)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>No items in cart</p>
                              <p className="text-xs">Add products to start a transaction</p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Totals and Payment */}
                    <div className="border-t p-4 space-y-3">
                      {(() => {
                        const summary = getCartSummary(activeSession);
                        return (
                          <>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Subtotal:</span>
                                <span>${summary.subtotal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Discount:</span>
                                <span>-${summary.discountAmount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Tax:</span>
                                <span>${summary.taxAmount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                                <span>Total:</span>
                                <span>${summary.total.toFixed(2)}</span>
                              </div>
                            </div>

                            {/* Bill Discount */}
                            <BillDiscountDialog
                              cartSummary={summary}
                              currentBillDiscount={activeSession ? (sessionDiscounts[activeSession] || 0) : 0}
                              onApplyDiscount={handleApplyBillDiscount}
                            />

                            <Button
                              className="w-full"
                              disabled={summary.itemCount === 0}
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Process Payment
                            </Button>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}