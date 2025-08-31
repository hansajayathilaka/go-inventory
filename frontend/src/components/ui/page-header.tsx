import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs = [],
  action,
  className,
}: PageHeaderProps) {
  const allBreadcrumbs = [
    { label: 'Dashboard', href: '/', onClick: () => window.location.href = '/' },
    ...breadcrumbs,
  ];

  return (
    <div className={cn('space-y-4 pb-4 border-b', className)}>
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={allBreadcrumbs[0].onClick}
        >
          <Home className="h-3 w-3 mr-1" />
          {allBreadcrumbs[0].label}
        </Button>
        
        {allBreadcrumbs.slice(1).map((item, index) => (
          <React.Fragment key={index}>
            <ChevronRight className="h-3 w-3" />
            {item.onClick || item.href ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={item.onClick || (() => item.href && (window.location.href = item.href))}
              >
                {item.label}
              </Button>
            ) : (
              <span className="px-2 text-foreground font-medium">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Header Content */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {action && (
          <div className="flex items-center space-x-2">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

export default PageHeader;