import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onSave?: () => void;
  onCancel?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  onSave,
  onCancel,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  loading = false,
  size = 'md',
  className,
  showCloseButton = true,
}: FormModalProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(sizeClasses[size], 'max-h-[90vh] flex flex-col', className)}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle>{title}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-6 -mr-6">
          <div className="space-y-4">{children}</div>
        </ScrollArea>

        {(footer || onSave || onCancel) && (
          <DialogFooter className="flex-shrink-0">
            {footer || (
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  {cancelLabel}
                </Button>
                {onSave && (
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {saveLabel}
                  </Button>
                )}
              </div>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Specialized CRUD Modal
export interface CrudModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit' | 'view';
  title?: string;
  entityName: string;
  children: React.ReactNode;
  onSave?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export function CrudModal({
  open,
  onOpenChange,
  mode,
  title,
  entityName,
  children,
  onSave,
  onCancel,
  loading = false,
  size = 'md',
  className,
}: CrudModalProps) {
  const getTitle = () => {
    if (title) return title;
    
    switch (mode) {
      case 'create':
        return `Create ${entityName}`;
      case 'edit':
        return `Edit ${entityName}`;
      case 'view':
        return `View ${entityName}`;
      default:
        return entityName;
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'create':
        return `Add a new ${entityName.toLowerCase()} to the system.`;
      case 'edit':
        return `Make changes to this ${entityName.toLowerCase()}.`;
      case 'view':
        return `View details for this ${entityName.toLowerCase()}.`;
      default:
        return undefined;
    }
  };

  const getSaveLabel = () => {
    switch (mode) {
      case 'create':
        return 'Create';
      case 'edit':
        return 'Update';
      default:
        return 'Save';
    }
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={getTitle()}
      description={getDescription()}
      saveLabel={getSaveLabel()}
      onSave={mode !== 'view' ? onSave : undefined}
      onCancel={onCancel}
      loading={loading}
      size={size}
      className={className}
    >
      {children}
    </FormModal>
  );
}

// Form Modal with validation state
export interface ValidatedFormModalProps extends FormModalProps {
  isValid?: boolean;
  validationMessage?: string;
}

export function ValidatedFormModal({
  isValid = true,
  validationMessage,
  onSave,
  ...props
}: ValidatedFormModalProps) {
  const handleSave = () => {
    if (!isValid) return;
    onSave?.();
  };

  return (
    <FormModal
      {...props}
      onSave={handleSave}
      footer={
        <div className="flex flex-col space-y-2">
          {!isValid && validationMessage && (
            <p className="text-sm text-destructive">{validationMessage}</p>
          )}
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={props.onCancel || (() => props.onOpenChange(false))}
              disabled={props.loading}
            >
              {props.cancelLabel || 'Cancel'}
            </Button>
            {onSave && (
              <Button
                type="button"
                onClick={handleSave}
                disabled={props.loading || !isValid}
              >
                {props.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {props.saveLabel || 'Save'}
              </Button>
            )}
          </div>
        </div>
      }
    />
  );
}

export default FormModal;