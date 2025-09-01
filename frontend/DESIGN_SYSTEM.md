# Design System Guide

This document outlines the design system implementation for the Vehicle Spare Parts Shop application using shadcn/ui.

## Design Philosophy

Our design system is built on the following principles:

### 1. Consistency
- Unified visual language across all components
- Standardized spacing, typography, and color usage
- Consistent interaction patterns

### 2. Accessibility
- WCAG 2.1 AA compliance
- Screen reader compatibility
- Keyboard navigation support
- High contrast themes

### 3. Flexibility
- Theme-aware color system
- Responsive design patterns
- Customizable component variants

### 4. Performance
- Optimized component loading
- Efficient state management
- Minimal bundle size

## Visual Foundation

### Color System

#### Theme Colors
```css
/* Light theme */
--background: 0 0% 100%;          /* Pure white */
--foreground: 222.2 84% 4.9%;     /* Near black */
--card: 0 0% 100%;                /* Card background */
--card-foreground: 222.2 84% 4.9%; /* Card text */
--popover: 0 0% 100%;             /* Popover background */
--popover-foreground: 222.2 84% 4.9%; /* Popover text */
--primary: 222.2 47.4% 11.2%;     /* Primary brand color */
--primary-foreground: 210 40% 98%; /* Primary text */
--secondary: 210 40% 96%;         /* Secondary background */
--secondary-foreground: 222.2 84% 4.9%; /* Secondary text */
--muted: 210 40% 96%;             /* Muted background */
--muted-foreground: 215.4 16.3% 46.9%; /* Muted text */
--accent: 210 40% 96%;            /* Accent background */
--accent-foreground: 222.2 84% 4.9%; /* Accent text */
--destructive: 0 84.2% 60.2%;     /* Error/danger color */
--destructive-foreground: 210 40% 98%; /* Error text */
--border: 214.3 31.8% 91.4%;     /* Border color */
--input: 214.3 31.8% 91.4%;      /* Input border */
--ring: 222.2 84% 4.9%;          /* Focus ring */
```

#### Status Colors
- **Success**: Green variants for positive actions
- **Warning**: Yellow/amber for cautions
- **Error**: Red variants for errors and destructive actions
- **Info**: Blue variants for informational content

### Typography

#### Font Stack
```css
font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif
```

#### Font Sizes
- **text-xs**: 12px (labels, captions)
- **text-sm**: 14px (body text, buttons)
- **text-base**: 16px (main content)
- **text-lg**: 18px (headings)
- **text-xl**: 20px (page titles)
- **text-2xl**: 24px (section headings)
- **text-3xl**: 30px (main titles)

#### Font Weights
- **font-normal**: 400 (body text)
- **font-medium**: 500 (emphasis)
- **font-semibold**: 600 (headings)
- **font-bold**: 700 (strong emphasis)

### Spacing System

#### Spacing Scale (Tailwind)
```css
0.5 = 2px    /* Fine adjustments */
1   = 4px    /* Minimal spacing */
2   = 8px    /* Small spacing */
3   = 12px   /* Medium-small spacing */
4   = 16px   /* Standard spacing */
6   = 24px   /* Large spacing */
8   = 32px   /* Extra large spacing */
12  = 48px   /* Section spacing */
16  = 64px   /* Page spacing */
```

#### Component Spacing
- **Card padding**: p-6 (24px)
- **Button padding**: px-4 py-2 (16px horizontal, 8px vertical)
- **Form spacing**: space-y-4 (16px between fields)
- **Section margins**: mb-6 or mb-8 (24px or 32px)

### Border Radius
- **rounded-sm**: 2px (subtle rounding)
- **rounded**: 4px (standard rounding)
- **rounded-md**: 6px (medium rounding)
- **rounded-lg**: 8px (large rounding)
- **rounded-xl**: 12px (extra large rounding)

## Component Hierarchy

### Layout Components
1. **Page Container**: Full page wrapper
2. **Content Area**: Main content region
3. **Sidebar**: Navigation area
4. **Header**: Top navigation and branding

### Content Components
1. **Cards**: Content containers
2. **Tables**: Data display
3. **Forms**: User input
4. **Lists**: Content organization

### Interactive Components
1. **Buttons**: Primary actions
2. **Links**: Navigation
3. **Form Controls**: User input
4. **Modals**: Focused interactions

## Design Tokens

### Size Tokens
```typescript
const sizes = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem' // 30px
};
```

### Shadow Tokens
```typescript
const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
};
```

## Component Variants

### Button Variants
```typescript
const buttonVariants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline'
};
```

### Badge Variants
```typescript
const badgeVariants = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  outline: 'text-foreground border border-input'
};
```

## Layout Patterns

### Page Layout
```typescript
const PageLayout = ({ children }) => (
  <div className="flex h-screen bg-background">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  </div>
);
```

### Card Layout
```typescript
const CardLayout = ({ title, children, actions }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>{title}</CardTitle>
      {actions && <div className="flex gap-2">{actions}</div>}
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
);
```

### Form Layout
```typescript
const FormLayout = ({ children }) => (
  <form className="space-y-4">
    {children}
  </form>
);
```

## Responsive Design

### Breakpoints
```typescript
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px' // Extra large desktop
};
```

### Responsive Patterns
- **Mobile First**: Start with mobile design, enhance for larger screens
- **Flexible Grids**: Use CSS Grid and Flexbox for responsive layouts
- **Fluid Typography**: Scale typography with viewport size
- **Touch Targets**: Ensure interactive elements are at least 44px

## Animation Guidelines

### Transition Durations
- **Fast**: 150ms (hover states, focus)
- **Normal**: 300ms (modals, dropdowns)
- **Slow**: 500ms (page transitions)

### Easing Functions
- **Ease Out**: Natural feeling for user interactions
- **Ease In**: Smooth entry animations
- **Ease In Out**: Balanced for complex animations

## Content Guidelines

### Writing Style
- **Clear and Concise**: Use simple, direct language
- **Consistent Terminology**: Maintain vocabulary throughout
- **Action-Oriented**: Use active voice for buttons and actions

### Icon Usage
- **Lucide React**: Consistent icon library
- **16px Standard**: Use consistent icon sizes
- **Meaningful**: Icons should enhance understanding
- **Accessible**: Include alt text for screen readers

## Quality Assurance

### Design Review Checklist
- [ ] Consistent color usage (no hardcoded colors)
- [ ] Proper spacing and alignment
- [ ] Responsive design testing
- [ ] Accessibility compliance
- [ ] Theme compatibility (light/dark)
- [ ] Component reusability
- [ ] Performance optimization

### Testing Requirements
- **Visual Regression**: Automated screenshot testing
- **Accessibility**: Screen reader and keyboard testing
- **Cross-browser**: Chrome, Firefox, Safari, Edge
- **Device Testing**: Mobile, tablet, desktop

## Implementation Status

### ✅ Completed
- shadcn/ui component library integration
- Theme system with light/dark modes
- Responsive layout patterns
- Accessibility features
- Component documentation

### 🚧 In Progress
- Design token standardization
- Animation system implementation
- Advanced component variants

### 📋 Planned
- Storybook integration
- Design system automation
- Performance monitoring
- Component testing framework

## Resources

- **shadcn/ui Documentation**: https://ui.shadcn.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **Radix UI Primitives**: https://www.radix-ui.com/
- **Accessibility Guidelines**: https://www.w3.org/WAI/WCAG21/
- **Component Examples**: `/frontend/src/components/ui/`