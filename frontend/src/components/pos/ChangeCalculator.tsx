import { useMemo } from 'react'
import { Coins, Banknote, Calculator } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ChangeCalculatorProps {
  totalAmount: number
  paidAmount: number
  showBreakdown?: boolean
  className?: string
}

interface ChangeBreakdown {
  bills: { denomination: number; count: number }[]
  coins: { denomination: number; count: number }[]
}

// US currency denominations (can be configured for different currencies)
const BILL_DENOMINATIONS = [100, 50, 20, 10, 5, 1]
const COIN_DENOMINATIONS = [0.25, 0.10, 0.05, 0.01] // Quarter, Dime, Nickel, Penny

export function ChangeCalculator({
  totalAmount,
  paidAmount,
  showBreakdown = true,
  className
}: ChangeCalculatorProps) {
  const changeAmount = Math.max(0, paidAmount - totalAmount)
  
  const changeBreakdown = useMemo((): ChangeBreakdown => {
    if (changeAmount <= 0) {
      return { bills: [], coins: [] }
    }

    let remainingChange = Math.round(changeAmount * 100) // Work in cents to avoid floating point issues
    const bills: { denomination: number; count: number }[] = []
    const coins: { denomination: number; count: number }[] = []

    // Calculate bills
    for (const bill of BILL_DENOMINATIONS) {
      const billCents = bill * 100
      if (remainingChange >= billCents) {
        const count = Math.floor(remainingChange / billCents)
        bills.push({ denomination: bill, count })
        remainingChange -= count * billCents
      }
    }

    // Calculate coins
    for (const coin of COIN_DENOMINATIONS) {
      const coinCents = Math.round(coin * 100)
      if (remainingChange >= coinCents) {
        const count = Math.floor(remainingChange / coinCents)
        coins.push({ denomination: coin, count })
        remainingChange -= count * coinCents
      }
    }

    return { bills, coins }
  }, [changeAmount])

  const getStatus = () => {
    if (paidAmount < totalAmount) {
      return {
        status: 'insufficient',
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200',
        message: 'Payment needed'
      }
    } else if (paidAmount === totalAmount) {
      return {
        status: 'exact',
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200',
        message: 'Exact payment'
      }
    } else {
      return {
        status: 'overpaid',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200',
        message: 'Change due'
      }
    }
  }

  const statusInfo = getStatus()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getDenominationName = (denomination: number, count: number) => {
    if (denomination >= 1) {
      // Bills
      if (denomination === 1) return count === 1 ? '$1 bill' : '$1 bills'
      return `$${denomination} ${count === 1 ? 'bill' : 'bills'}`
    } else {
      // Coins
      const cents = Math.round(denomination * 100)
      switch (cents) {
        case 25:
          return count === 1 ? 'quarter' : 'quarters'
        case 10:
          return count === 1 ? 'dime' : 'dimes'
        case 5:
          return count === 1 ? 'nickel' : 'nickels'
        case 1:
          return count === 1 ? 'penny' : 'pennies'
        default:
          return `${cents}¢ ${count === 1 ? 'coin' : 'coins'}`
      }
    }
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5" />
          Change Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount Summary */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-muted-foreground">
              {formatCurrency(totalAmount)}
            </div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div>
            <div className="text-lg font-semibold">
              {formatCurrency(paidAmount)}
            </div>
            <div className="text-sm text-muted-foreground">Paid</div>
          </div>
          <div>
            <div className={cn("text-xl font-bold", statusInfo.color)}>
              {formatCurrency(changeAmount)}
            </div>
            <div className="text-sm text-muted-foreground">Change</div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className={cn(
          "p-3 rounded-lg border text-center",
          statusInfo.bgColor
        )}>
          <div className={cn("font-medium", statusInfo.color)}>
            {statusInfo.message}
          </div>
          {changeAmount > 0 && (
            <div className="text-sm text-muted-foreground mt-1">
              Customer needs {formatCurrency(changeAmount)} in change
            </div>
          )}
          {paidAmount < totalAmount && (
            <div className="text-sm text-muted-foreground mt-1">
              {formatCurrency(totalAmount - paidAmount)} still needed
            </div>
          )}
        </div>

        {/* Change Breakdown */}
        {showBreakdown && changeAmount > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Coins className="h-4 w-4" />
              Suggested Change Breakdown
            </div>
            
            <div className="space-y-2">
              {/* Bills */}
              {changeBreakdown.bills.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Banknote className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Bills</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {changeBreakdown.bills.map((bill) => (
                      <div
                        key={bill.denomination}
                        className="flex justify-between items-center p-2 bg-green-50 rounded border"
                      >
                        <span className="text-sm">
                          {getDenominationName(bill.denomination, bill.count)}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {bill.count}×
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coins */}
              {changeBreakdown.coins.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium">Coins</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {changeBreakdown.coins.map((coin) => (
                      <div
                        key={coin.denomination}
                        className="flex justify-between items-center p-2 bg-amber-50 rounded border"
                      >
                        <span className="text-sm">
                          {getDenominationName(coin.denomination, coin.count)}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {coin.count}×
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total verification */}
              <div className="p-2 bg-muted rounded text-center">
                <div className="text-sm text-muted-foreground">
                  Total change: {formatCurrency(changeAmount)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {changeAmount === 0 && paidAmount >= totalAmount && (
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-green-700 font-medium mb-1">
              ✓ Payment Complete
            </div>
            <div className="text-sm text-green-600">
              No change required - exact payment received
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}