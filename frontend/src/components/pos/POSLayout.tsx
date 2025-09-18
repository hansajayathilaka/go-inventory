import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingCart,
  Search,
  CreditCard,
  X
} from 'lucide-react';
import { SessionManager } from './SessionManager';
import { usePOSSessionStore } from '@/stores/pos/posSessionStore';
import { usePOSCartStore } from '@/stores/pos/posCartStore';

interface POSLayoutProps {
  activeSession: string | null;
  onSessionChange: (sessionId: string) => void;
}

export function POSLayout({ activeSession, onSessionChange }: POSLayoutProps) {
  const { getSession } = usePOSSessionStore();
  const { getCartItems, getCartSummary, addItem, removeItem, updateItem } = usePOSCartStore();

  const currentSession = activeSession ? getSession(activeSession) : null;

  const handleAddToCart = (productId: string, productName: string, productSku: string, price: number) => {
    if (!activeSession) return;
    addItem(activeSession, { productId, productName, productSku, price });
  };

  const handleRemoveFromCart = (itemId: string) => {
    if (!activeSession) return;
    removeItem(activeSession, itemId);
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (!activeSession) return;
    updateItem(activeSession, itemId, { quantity });
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
        <div className="flex-1 flex">
          <Tabs value={activeSession} onValueChange={onSessionChange} className="flex-1">
            <TabsContent value={activeSession} className="h-full m-0">
              <div className="grid grid-cols-12 h-full">

                {/* Product Selection Area */}
                <div className="col-span-8 border-r bg-background">
                  <div className="h-full flex flex-col">

                    {/* Search and Filters */}
                    <div className="p-4 border-b bg-card">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Search products, SKU, or scan barcode..."
                            className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background"
                          />
                        </div>
                        <Button variant="outline">
                          Categories
                        </Button>
                        <Button variant="outline">
                          Barcode
                        </Button>
                      </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 p-4">
                      <div className="grid grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <Card
                            key={i}
                            className="p-4 cursor-pointer hover:bg-accent transition-colors"
                            onClick={() => handleAddToCart(
                              `product-${i + 1}`,
                              `Sample Product ${i + 1}`,
                              `SKU-${i + 1}`,
                              29.99 + i * 10
                            )}
                          >
                            <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center">
                              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-medium text-sm mb-1">Sample Product {i + 1}</h3>
                            <p className="text-xs text-muted-foreground mb-2">SKU-{i + 1}</p>
                            <p className="font-semibold text-primary">${(29.99 + i * 10).toFixed(2)}</p>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shopping Cart and Payment Area */}
                <div className="col-span-4 bg-card">
                  <div className="h-full flex flex-col">
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
                    <div className="flex-1 p-4">
                      <h3 className="font-medium mb-3">Cart Items</h3>
                      {(() => {
                        const cartItems = getCartItems(activeSession);
                        return cartItems.length > 0 ? (
                          <div className="space-y-3">
                            {cartItems.map((item) => (
                              <Card key={item.id} className="p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm">{item.productName}</h4>
                                    <p className="text-xs text-muted-foreground">{item.productSku}</p>
                                    <div className="flex items-center space-x-2 mt-1">
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