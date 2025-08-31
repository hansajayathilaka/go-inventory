import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Trash2, 
  Info, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  type LucideIcon 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConfirmationType = 'info' | 'warning' | 'error' | 'success' | 'delete';

export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  type?: ConfirmationType;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
  destructive?: boolean;
  icon?: LucideIcon;
  showIcon?: boolean;
}

const typeConfigs: Record<ConfirmationType, {
  icon: LucideIcon;
  confirmVariant: 'default' | 'destructive' | 'outline' | 'secondary';
  iconColor: string;
}> = {
  info: {
    icon: Info,
    confirmVariant: 'default',
    iconColor: 'text-blue-500',
  },
  warning: {
    icon: AlertTriangle,
    confirmVariant: 'default',
    iconColor: 'text-yellow-500',
  },
  error: {
    icon: XCircle,
    confirmVariant: 'destructive',
    iconColor: 'text-red-500',
  },
  success: {
    icon: CheckCircle,
    confirmVariant: 'default',
    iconColor: 'text-green-500',
  },
  delete: {
    icon: Trash2,
    confirmVariant: 'destructive',
    iconColor: 'text-red-500',
  },
};

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  type = 'info',
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  destructive,
  icon,
  showIcon = true,
}: ConfirmationDialogProps) {
  const config = typeConfigs[type];
  const Icon = icon || config.icon;
  const variant = destructive !== undefined 
    ? (destructive ? 'destructive' : 'default') 
    : config.confirmVariant;

  const getDefaultConfirmLabel = () => {
    switch (type) {
      case 'delete':
        return 'Delete';
      case 'error':
        return 'Continue';
      case 'warning':
        return 'Proceed';
      case 'success':
        return 'OK';
      default:
        return 'Confirm';
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {showIcon && (
              <div className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                type === 'error' || type === 'delete' ? 'bg-red-100 dark:bg-red-900/20' : 
                type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                type === 'success' ? 'bg-green-100 dark:bg-green-900/20' :
                'bg-blue-100 dark:bg-blue-900/20'
              )}>
                <Icon className={cn('h-5 w-5', config.iconColor)} />
              </div>
            )}
            <AlertDialogTitle className="text-left">{title}</AlertDialogTitle>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogDescription className="text-left whitespace-pre-line">
          {description}
        </AlertDialogDescription>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={loading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className={variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
            )}
            {confirmLabel || getDefaultConfirmLabel()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Specialized delete confirmation dialog
export interface DeleteConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemType?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
  additionalInfo?: string;
}

export function DeleteConfirmation({
  open,
  onOpenChange,
  itemName,
  itemType = 'item',
  onConfirm,
  onCancel,
  loading = false,
  additionalInfo,
}: DeleteConfirmationProps) {
  const description = `Are you sure you want to delete "${itemName}"?${
    additionalInfo ? `\n\n${additionalInfo}` : ''
  }\n\nThis action cannot be undone.`;

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Delete ${itemType}`}
      description={description}
      type="delete"
      confirmLabel="Delete"
      onConfirm={onConfirm}
      onCancel={onCancel}
      loading={loading}
    />
  );
}

// Unsaved changes confirmation
export interface UnsavedChangesConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function UnsavedChangesConfirmation({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: UnsavedChangesConfirmationProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Unsaved Changes"
      description="You have unsaved changes that will be lost if you continue. Are you sure you want to proceed without saving?"
      type="warning"
      confirmLabel="Discard Changes"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

// Bulk action confirmation
export interface BulkActionConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: string;
  itemCount: number;
  itemType?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
  destructive?: boolean;
}

export function BulkActionConfirmation({
  open,
  onOpenChange,
  action,
  itemCount,
  itemType = 'items',
  onConfirm,
  onCancel,
  loading = false,
  destructive = false,
}: BulkActionConfirmationProps) {
  const description = `Are you sure you want to ${action.toLowerCase()} ${itemCount} ${itemType}?${
    destructive ? '\n\nThis action cannot be undone.' : ''
  }`;

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${action} ${itemType}`}
      description={description}
      type={destructive ? 'delete' : 'warning'}
      confirmLabel={action}
      onConfirm={onConfirm}
      onCancel={onCancel}
      loading={loading}
      destructive={destructive}
    />
  );
}

export default ConfirmationDialog;