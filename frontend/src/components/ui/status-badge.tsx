import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  XCircle, 
  Info, 
  AlertTriangle,
  Zap,
  Package,
  UserCheck,
  ShieldCheck,
  Truck,
  DollarSign,
  type LucideIcon
} from 'lucide-react';

export type StatusType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'pending' 
  | 'active' 
  | 'inactive' 
  | 'approved' 
  | 'rejected' 
  | 'draft' 
  | 'published'
  | 'low'
  | 'medium' 
  | 'high'
  | 'critical'
  | 'in-stock'
  | 'out-of-stock'
  | 'low-stock'
  | 'ordered'
  | 'received'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface StatusConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
  icon?: LucideIcon;
}

const statusConfigs: Record<StatusType, StatusConfig> = {
  success: {
    label: 'Success',
    variant: 'default',
    className: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300',
    icon: CheckCircle,
  },
  error: {
    label: 'Error',
    variant: 'destructive',
    icon: XCircle,
  },
  warning: {
    label: 'Warning',
    variant: 'outline',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700',
    icon: AlertTriangle,
  },
  info: {
    label: 'Info',
    variant: 'secondary',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
    icon: Info,
  },
  pending: {
    label: 'Pending',
    variant: 'outline',
    className: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-100 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700',
    icon: Clock,
  },
  active: {
    label: 'Active',
    variant: 'default',
    className: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300',
    icon: CheckCircle,
  },
  inactive: {
    label: 'Inactive',
    variant: 'secondary',
    icon: AlertCircle,
  },
  approved: {
    label: 'Approved',
    variant: 'default',
    className: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300',
    icon: ShieldCheck,
  },
  rejected: {
    label: 'Rejected',
    variant: 'destructive',
    icon: XCircle,
  },
  draft: {
    label: 'Draft',
    variant: 'outline',
    icon: AlertCircle,
  },
  published: {
    label: 'Published',
    variant: 'default',
    className: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300',
    icon: CheckCircle,
  },
  low: {
    label: 'Low',
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300',
  },
  medium: {
    label: 'Medium',
    variant: 'outline',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700',
    icon: AlertTriangle,
  },
  high: {
    label: 'High',
    variant: 'outline',
    className: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-100 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700',
    icon: AlertTriangle,
  },
  critical: {
    label: 'Critical',
    variant: 'destructive',
    icon: AlertTriangle,
  },
  'in-stock': {
    label: 'In Stock',
    variant: 'default',
    className: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300',
    icon: Package,
  },
  'out-of-stock': {
    label: 'Out of Stock',
    variant: 'destructive',
    icon: Package,
  },
  'low-stock': {
    label: 'Low Stock',
    variant: 'outline',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700',
    icon: AlertTriangle,
  },
  ordered: {
    label: 'Ordered',
    variant: 'outline',
    className: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700',
    icon: Clock,
  },
  received: {
    label: 'Received',
    variant: 'default',
    className: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300',
    icon: Package,
  },
  shipped: {
    label: 'Shipped',
    variant: 'outline',
    className: 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-100 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700',
    icon: Truck,
  },
  delivered: {
    label: 'Delivered',
    variant: 'default',
    className: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'destructive',
    icon: XCircle,
  },
};

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showIcon?: boolean;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  iconClassName?: string;
}

export function StatusBadge({
  status,
  label,
  showIcon = true,
  size = 'default',
  className,
  iconClassName,
}: StatusBadgeProps) {
  const config = statusConfigs[status];
  const displayLabel = label || config.label;
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        // Size variants
        size === 'sm' && 'text-xs px-2 py-0.5',
        size === 'lg' && 'text-sm px-3 py-1',
        // Custom config className
        config.className,
        // Icon spacing
        showIcon && Icon && 'flex items-center gap-1',
        // Custom className
        className
      )}
    >
      {showIcon && Icon && (
        <Icon 
          className={cn(
            'flex-shrink-0',
            size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5',
            iconClassName
          )} 
        />
      )}
      {displayLabel}
    </Badge>
  );
}

// Inventory status helper
export function InventoryStatusBadge({ 
  quantity, 
  reorderLevel = 10,
  ...props 
}: { 
  quantity: number; 
  reorderLevel?: number; 
} & Omit<StatusBadgeProps, 'status'>) {
  let status: StatusType;
  
  if (quantity === 0) {
    status = 'out-of-stock';
  } else if (quantity <= reorderLevel) {
    status = 'low-stock';
  } else {
    status = 'in-stock';
  }

  return <StatusBadge status={status} {...props} />;
}

// User role badge
export function UserRoleBadge({ 
  role,
  ...props 
}: { 
  role: string; 
} & Omit<StatusBadgeProps, 'status' | 'label'>) {
  const getRoleStatus = (role: string): StatusType => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'critical';
      case 'manager':
        return 'high';
      case 'staff':
        return 'medium';
      case 'viewer':
        return 'low';
      default:
        return 'info';
    }
  };

  return (
    <StatusBadge 
      status={getRoleStatus(role)} 
      label={role}
      icon={UserCheck}
      {...props} 
    />
  );
}

// Price badge for different price types
export function PriceBadge({
  type,
  amount,
  currency = '$',
  ...props
}: {
  type: 'cost' | 'retail' | 'wholesale';
  amount: number;
  currency?: string;
} & Omit<StatusBadgeProps, 'status' | 'label'>) {
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'cost':
        return { status: 'info' as StatusType, color: 'blue' };
      case 'retail':
        return { status: 'success' as StatusType, color: 'green' };
      case 'wholesale':
        return { status: 'warning' as StatusType, color: 'orange' };
      default:
        return { status: 'info' as StatusType, color: 'gray' };
    }
  };

  const config = getTypeConfig(type);
  const label = `${currency}${amount.toFixed(2)}`;

  return (
    <StatusBadge
      status={config.status}
      label={label}
      icon={DollarSign}
      {...props}
    />
  );
}

export default StatusBadge;