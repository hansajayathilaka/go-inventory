import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'

// Validation schema based on API response structure
const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(100, 'Name too long'),
  code: z.string().min(1, 'Customer code is required').max(20, 'Code too long'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(20, 'Phone number too long').optional(),
  address: z.string().max(200, 'Address too long').optional(),
  city: z.string().max(50, 'City name too long').optional(),
  state: z.string().max(50, 'State name too long').optional(),
  postal_code: z.string().max(20, 'Postal code too long').optional(),
  country: z.string().max(50, 'Country name too long').optional(),
  credit_limit: z.number().min(0, 'Credit limit must be positive').optional(),
})

type CustomerFormValues = z.infer<typeof customerSchema>

interface Customer {
  id: string
  name: string
  code: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  credit_limit?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface CustomerFormProps {
  customer?: Customer
  onSubmit: (data: CustomerFormValues) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  isEditing?: boolean
}

export function CustomerForm({
  customer,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditing = false
}: CustomerFormProps) {
  // Form setup
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name || '',
      code: customer?.code || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      address: customer?.address || '',
      city: customer?.city || '',
      state: customer?.state || '',
      postal_code: customer?.postal_code || '',
      country: customer?.country || '',
      credit_limit: customer?.credit_limit || 0,
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form

  const handleFormSubmit = async (data: CustomerFormValues) => {
    try {
      // Clean up empty strings to undefined for optional fields
      const cleanData = {
        ...data,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        postal_code: data.postal_code || undefined,
        country: data.country || undefined,
        credit_limit: data.credit_limit || undefined,
      }
      await onSubmit(cleanData)
    } catch (error) {
      console.error('Failed to submit customer form:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Customer Name and Code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Customer Name *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Enter customer name"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.name.message}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">Customer Code *</Label>
          <Input
            id="code"
            {...register('code')}
            placeholder="CUST001"
            className={errors.code ? 'border-red-500' : ''}
            disabled={isEditing} // Usually codes shouldn't be changed
          />
          {errors.code && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.code.message}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Email and Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="customer@email.com"
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.email.message}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            {...register('phone')}
            placeholder="+1 (555) 123-4567"
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.phone.message}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          {...register('address')}
          placeholder="Enter full address"
          rows={2}
          className={errors.address ? 'border-red-500' : ''}
        />
        {errors.address && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.address.message}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* City, State, Postal Code */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            {...register('city')}
            placeholder="Enter city"
            className={errors.city ? 'border-red-500' : ''}
          />
          {errors.city && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.city.message}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State/Province</Label>
          <Input
            id="state"
            {...register('state')}
            placeholder="Enter state"
            className={errors.state ? 'border-red-500' : ''}
          />
          {errors.state && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.state.message}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="postal_code">Postal Code</Label>
          <Input
            id="postal_code"
            {...register('postal_code')}
            placeholder="12345"
            className={errors.postal_code ? 'border-red-500' : ''}
          />
          {errors.postal_code && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.postal_code.message}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Country and Credit Limit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            {...register('country')}
            placeholder="Enter country"
            className={errors.country ? 'border-red-500' : ''}
          />
          {errors.country && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.country.message}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="credit_limit">Credit Limit</Label>
          <Input
            id="credit_limit"
            type="number"
            {...register('credit_limit', { valueAsNumber: true })}
            placeholder="1000.00"
            step="0.01"
            min="0"
            className={errors.credit_limit ? 'border-red-500' : ''}
          />
          {errors.credit_limit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.credit_limit.message}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            isEditing ? 'Update Customer' : 'Create Customer'
          )}
        </Button>
      </div>
    </form>
  )
}