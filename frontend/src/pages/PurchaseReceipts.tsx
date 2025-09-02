import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function PurchaseReceipts() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Purchase Receipts</h1>
        <Button>Create Purchase Order</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Purchase Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Purchase receipts, orders, and goods receiving interface will be displayed here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}