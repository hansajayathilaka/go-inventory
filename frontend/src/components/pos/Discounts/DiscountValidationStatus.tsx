import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Shield,
  Clock,
  User,
  AlertCircle
} from 'lucide-react';
import { DiscountValidationUtils, type EnhancedDiscountValidation } from '@/hooks/useDiscountValidation';

interface DiscountValidationStatusProps {
  validation: EnhancedDiscountValidation;
  showDetails?: boolean;
  onApprovalRequest?: () => void;
  className?: string;
}

export function DiscountValidationStatus({
  validation,
  showDetails = false,
  onApprovalRequest,
  className
}: DiscountValidationStatusProps) {
  const severity = DiscountValidationUtils.getValidationSeverity(validation);
  const warnings = DiscountValidationUtils.formatValidationWarnings(validation);
  const requiresAction = DiscountValidationUtils.requiresUserAction(validation);

  const getStatusIcon = () => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusText = () => {
    if (!validation.isValid) {
      return 'Invalid';
    }
    if (validation.requiresApproval) {
      return 'Requires Approval';
    }
    if (warnings.length > 0) {
      return 'Valid with Warnings';
    }
    return 'Valid';
  };

  const getStatusVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      case 'success':
        return 'default';
    }
  };

  if (!requiresAction && !showDetails) {
    return (
      <Badge variant={getStatusVariant()} className={className}>
        {getStatusIcon()}
        <span className="ml-1">{getStatusText()}</span>
      </Badge>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <Badge variant={getStatusVariant()}>
          {getStatusIcon()}
          <span className="ml-1">{getStatusText()}</span>
        </Badge>

        {validation.requiresApproval && (
          <Badge variant="outline" className="text-orange-600">
            <Shield className="h-3 w-3 mr-1" />
            Approval Required
          </Badge>
        )}
      </div>

      {/* Error Message */}
      {!validation.isValid && validation.errorMessage && (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {DiscountValidationUtils.formatValidationError(validation)}
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-1 mb-2">
          {warnings.map((warning, index) => (
            <Alert key={index} className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                {warning}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Approval Requirements */}
      {validation.requiresApproval && (
        <Alert className="border-orange-200 bg-orange-50 mb-2">
          <Shield className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="flex items-center justify-between">
              <span>{validation.approvalReason || 'Manager approval required for this discount'}</span>
              {onApprovalRequest && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onApprovalRequest}
                  className="ml-2"
                >
                  Request Approval
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Validation Info */}
      {showDetails && validation.context && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Info className="h-4 w-4 mr-2" />
              View Validation Details
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Discount Validation Details</DialogTitle>
              <DialogDescription>
                Comprehensive validation information for this discount
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Validation Summary */}
              <div className="bg-muted/20 p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Validation Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={getStatusVariant()} className="text-xs">
                      {getStatusText()}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Severity:</span>
                    <span className="capitalize">{severity}</span>
                  </div>
                  {validation.maxAllowedValue !== undefined && (
                    <div className="flex justify-between">
                      <span>Max Allowed:</span>
                      <span>{validation.maxAllowedValue}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Context Information */}
              <div className="bg-muted/20 p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Context Information
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>User Role:</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {validation.context.userRole}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer Type:</span>
                    <span className="capitalize">{validation.context.customerType || 'Regular'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transaction Value:</span>
                    <span>${validation.context.transactionValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timestamp:</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {validation.context.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Approval Information */}
              {validation.requiresApproval && (
                <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-1 text-orange-800">
                    <Shield className="h-4 w-4" />
                    Approval Required
                  </h4>
                  <div className="space-y-1 text-sm text-orange-700">
                    <p>{validation.approvalReason}</p>
                    <p className="text-xs">Contact a manager or supervisor to proceed with this discount.</p>
                  </div>
                </div>
              )}

              {/* Warnings Detail */}
              {warnings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Warnings ({warnings.length})
                  </h4>
                  <div className="space-y-1">
                    {warnings.map((warning, index) => (
                      <div key={index} className="text-sm bg-orange-50 p-2 rounded border border-orange-200">
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Success Message */}
              {validation.isValid && !validation.requiresApproval && warnings.length === 0 && (
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium text-sm">
                      Discount validation passed successfully
                    </span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    This discount meets all validation requirements and can be applied.
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}