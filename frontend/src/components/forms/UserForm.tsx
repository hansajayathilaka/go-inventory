import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'

// Validation schema based on API response structure
const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['admin', 'manager', 'staff', 'viewer']),
})

type UserFormValues = z.infer<typeof userSchema>

interface User {
  id: string
  username: string
  email: string
  role: string
  created_at: string
  updated_at: string
  last_login?: string
}

interface UserFormProps {
  user?: User
  onSubmit: (data: UserFormValues) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  isEditing?: boolean
}

const roleLabels = {
  admin: 'Administrator',
  manager: 'Manager',
  staff: 'Staff',
  viewer: 'Viewer'
}

const roleDescriptions = {
  admin: 'Full system access and management',
  manager: 'Management and oversight access',
  staff: 'Operational access',
  viewer: 'Read-only access'
}

export function UserForm({
  user,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditing = false
}: UserFormProps) {
  // Form setup
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema.refine(data => {
      // Password is required for new users, optional for editing
      if (!isEditing && !data.password) {
        return false
      }
      return true
    }, {
      message: "Password is required for new users",
      path: ["password"]
    })),
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
      password: '',
      role: (user?.role as any) || 'viewer',
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form

  const watchedRole = watch('role')

  const handleFormSubmit = async (data: UserFormValues) => {
    try {
      // Clean up password field for editing if empty
      const cleanData = {
        ...data,
        password: (isEditing && !data.password) ? undefined : data.password,
      }
      await onSubmit(cleanData)
    } catch (error) {
      console.error('Failed to submit user form:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Username and Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username *</Label>
          <Input
            id="username"
            {...register('username')}
            placeholder="Enter username"
            className={errors.username ? 'border-red-500' : ''}
          />
          {errors.username && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.username.message}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="user@company.com"
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.email.message}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">
          Password {!isEditing && '*'}
          {isEditing && <span className="text-sm text-muted-foreground">(leave blank to keep current password)</span>}
        </Label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          placeholder={isEditing ? "Enter new password (optional)" : "Enter password"}
          className={errors.password ? 'border-red-500' : ''}
        />
        {errors.password && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.password.message}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Role Selection */}
      <div className="space-y-2">
        <Label htmlFor="role">Role *</Label>
        <Select
          value={watchedRole}
          onValueChange={(value) => setValue('role', value as any)}
        >
          <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select user role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">
              <div className="flex flex-col">
                <span className="font-medium text-red-600">Administrator</span>
                <span className="text-xs text-muted-foreground">Full system access</span>
              </div>
            </SelectItem>
            <SelectItem value="manager">
              <div className="flex flex-col">
                <span className="font-medium text-blue-600">Manager</span>
                <span className="text-xs text-muted-foreground">Management access</span>
              </div>
            </SelectItem>
            <SelectItem value="staff">
              <div className="flex flex-col">
                <span className="font-medium text-green-600">Staff</span>
                <span className="text-xs text-muted-foreground">Operational access</span>
              </div>
            </SelectItem>
            <SelectItem value="viewer">
              <div className="flex flex-col">
                <span className="font-medium text-gray-600">Viewer</span>
                <span className="text-xs text-muted-foreground">Read-only access</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.role.message}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Role Description */}
      {watchedRole && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{roleLabels[watchedRole as keyof typeof roleLabels]}:</strong>{' '}
            {roleDescriptions[watchedRole as keyof typeof roleDescriptions]}
          </AlertDescription>
        </Alert>
      )}

      {/* Security Warning for Admin Role */}
      {watchedRole === 'admin' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> Administrator role provides full system access including user management and system settings.
            Only assign this role to trusted users.
          </AlertDescription>
        </Alert>
      )}

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
            isEditing ? 'Update User' : 'Create User'
          )}
        </Button>
      </div>
    </form>
  )
}