import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import type { Supplier } from '@/types/inventory'

// Validation schema
const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').max(100, 'Name too long'),
  code: z.string().min(1, 'Supplier code is required').max(20, 'Code too long'),
  contact_name: z.string().max(100, 'Contact name too long').optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(20, 'Phone number too long').optional(),
  address: z.string().max(200, 'Address too long').optional(),
  city: z.string().max(50, 'City name too long').optional(),
  country: z.string().max(50, 'Country name too long').optional(),
  tax_id: z.string().max(50, 'Tax ID too long').optional(),
  payment_terms: z.string().max(100, 'Payment terms too long').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
})

type SupplierFormValues = z.infer<typeof supplierSchema>

interface SupplierFormProps {
  supplier?: Supplier
  onSubmit: (data: SupplierFormValues) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  isEditing?: boolean
}

export function SupplierForm({
  supplier,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditing = false
}: SupplierFormProps) {
  // Form setup
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: supplier?.name || '',
      code: (supplier as any)?.code || '',
      contact_name: (supplier as any)?.contact_name || '',
      email: supplier?.email || '',
      phone: supplier?.phone || '',
      address: supplier?.address || '',
      city: supplier?.city || '',
      country: supplier?.country || '',
      tax_id: supplier?.tax_id || '',
      payment_terms: supplier?.payment_terms || '',
      notes: (supplier as any)?.notes || '',
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form

  const handleFormSubmit = async (data: SupplierFormValues) => {
    try {
      // Clean up empty strings to undefined for optional fields
      const cleanData = {
        ...data,
        contact_name: data.contact_name || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        country: data.country || undefined,
        tax_id: data.tax_id || undefined,
        payment_terms: data.payment_terms || undefined,
        notes: data.notes || undefined,
      }
      await onSubmit(cleanData)
    } catch (error) {
      console.error('Failed to submit supplier form:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Supplier Name and Code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Supplier Name *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Enter supplier name"
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
          <Label htmlFor="code">Supplier Code *</Label>
          <Input
            id="code"
            {...register('code')}
            placeholder="SUPP001"
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

      {/* Contact Person */}
      <div className="space-y-2">
        <Label htmlFor="contact_name">Contact Person</Label>
        <Input
          id="contact_name"
          {...register('contact_name')}
          placeholder="Enter contact person name"
          className={errors.contact_name ? 'border-red-500' : ''}
        />
        {errors.contact_name && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.contact_name.message}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Email and Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="supplier@company.com"
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

      {/* City and Country */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      {/* Tax ID and Payment Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tax_id">Tax ID</Label>
          <Input
            id="tax_id"
            {...register('tax_id')}
            placeholder="Enter tax ID"
            className={errors.tax_id ? 'border-red-500' : ''}
          />
          {errors.tax_id && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.tax_id.message}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_terms">Payment Terms</Label>
          <Input
            id="payment_terms"
            {...register('payment_terms')}
            placeholder="e.g., Net 30 days"
            className={errors.payment_terms ? 'border-red-500' : ''}
          />
          {errors.payment_terms && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.payment_terms.message}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="Additional notes about the supplier"
          rows={3}
          className={errors.notes ? 'border-red-500' : ''}
        />
        {errors.notes && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.notes.message}</AlertDescription>
          </Alert>
        )}
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
            isEditing ? 'Update Supplier' : 'Create Supplier'
          )}
        </Button>
      </div>
    </form>
  )
}