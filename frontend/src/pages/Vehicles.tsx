import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function Vehicles() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Vehicle Compatibility</h1>
        <Button>Add Vehicle Model</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Vehicle & Brand Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Vehicle brands, models, and product compatibility management will be displayed here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}