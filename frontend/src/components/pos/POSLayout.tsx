import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  X,
  Pause,
  Play,
  ShoppingCart,
  Search,
  CreditCard
} from 'lucide-react';

interface POSLayoutProps {
  activeSession: string;
  onSessionChange: (sessionId: string) => void;
}

interface SessionData {
  id: string;
  name: string;
  status: 'active' | 'on-hold' | 'completed';
  itemCount: number;
  total: number;
}

export function POSLayout({ activeSession, onSessionChange }: POSLayoutProps) {
  // Mock session data - will be replaced with real state management
  const sessions: SessionData[] = [
    { id: 'session-1', name: 'Session 1', status: 'active', itemCount: 3, total: 127.50 },
    { id: 'session-2', name: 'Session 2', status: 'on-hold', itemCount: 1, total: 45.00 },
  ];

  const handleNewSession = () => {
    // TODO: Implement new session creation
    console.log('Creating new session...');
  };

  const handleCloseSession = (sessionId: string) => {
    // TODO: Implement session closure
    console.log('Closing session:', sessionId);
  };

  const handleHoldSession = (sessionId: string) => {
    // TODO: Implement session hold/resume
    console.log('Toggling session hold:', sessionId);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Session Management Tabs */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between px-6 py-2">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-semibold">Point of Sale</h1>
            <Badge variant="secondary">Multi-Session POS</Badge>
          </div>

          <Tabs value={activeSession} onValueChange={onSessionChange} className="flex-1 max-w-2xl mx-4">
            <div className="flex items-center space-x-2">
              <TabsList className="grid w-full grid-cols-fit">
                {sessions.map((session) => (
                  <TabsTrigger
                    key={session.id}
                    value={session.id}
                    className="relative group"
                  >
                    <div className="flex items-center space-x-2">
                      <span>{session.name}</span>
                      {session.status === 'on-hold' && (
                        <Pause className="h-3 w-3 text-orange-500" />
                      )}
                      {session.itemCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {session.itemCount}
                        </Badge>
                      )}
                    </div>

                    {/* Session Actions */}
                    <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleHoldSession(session.id);
                          }}
                        >
                          {session.status === 'on-hold' ? (
                            <Play className="h-3 w-3" />
                          ) : (
                            <Pause className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseSession(session.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>

              <Button
                size="sm"
                variant="outline"
                onClick={handleNewSession}
                className="flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>New Session</span>
              </Button>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Main POS Interface */}
      <div className="flex-1 flex">
        <Tabs value={activeSession} onValueChange={onSessionChange} className="flex-1">
          {sessions.map((session) => (
            <TabsContent key={session.id} value={session.id} className="h-full m-0">
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

                    {/* Product Grid Placeholder */}
                    <div className="flex-1 p-4">
                      <div className="grid grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <Card key={i} className="p-4 cursor-pointer hover:bg-accent transition-colors">
                            <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center">
                              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-medium text-sm mb-1">Product {i + 1}</h3>
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
                        <h2 className="font-semibold">{session.name}</h2>
                        <Badge
                          variant={session.status === 'active' ? 'default' : 'secondary'}
                        >
                          {session.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {session.itemCount} items • ${session.total.toFixed(2)}
                      </p>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 p-4">
                      <h3 className="font-medium mb-3">Cart Items</h3>

                      {session.itemCount > 0 ? (
                        <div className="space-y-3">
                          {Array.from({ length: session.itemCount }).map((_, i) => (
                            <Card key={i} className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm">Sample Product {i + 1}</h4>
                                  <p className="text-xs text-muted-foreground">SKU-{i + 1}</p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Button size="sm" variant="outline" className="h-6 w-6 p-0">-</Button>
                                    <span className="text-sm">1</span>
                                    <Button size="sm" variant="outline" className="h-6 w-6 p-0">+</Button>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-sm">${(29.99 + i * 20).toFixed(2)}</p>
                                  <Button size="sm" variant="ghost" className="text-destructive p-0">
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
                      )}
                    </div>

                    {/* Totals and Payment */}
                    <div className="border-t p-4 space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>${session.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Tax:</span>
                          <span>${(session.total * 0.08).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span>${(session.total * 1.08).toFixed(2)}</span>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        disabled={session.itemCount === 0}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Process Payment
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}