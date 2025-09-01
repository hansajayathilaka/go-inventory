# Theming System Guide

This document provides comprehensive guidance on using the theme system implemented in the Vehicle Spare Parts Shop application.

## Theme Architecture

### CSS Variables Foundation
The theming system is built on CSS custom properties (variables) that automatically adapt to light and dark modes.

#### Theme Structure
```css
:root {
  /* Light theme variables */
}

.dark {
  /* Dark theme overrides */
}
```

### Theme Provider
The application uses a React Context-based theme provider for state management:

```typescript
// Theme context
const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({
  theme: 'system',
  setTheme: () => null,
});

// Theme provider component
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('system');
  
  // System theme detection and application
  useEffect(() => {
    // Theme application logic
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

## Color System

### Primary Colors
```css
/* Light Mode */
--background: 0 0% 100%;              /* White */
--foreground: 222.2 84% 4.9%;         /* Dark gray */
--card: 0 0% 100%;                    /* White cards */
--card-foreground: 222.2 84% 4.9%;   /* Dark text on cards */

/* Dark Mode */
--background: 222.2 84% 4.9%;         /* Dark background */
--foreground: 210 40% 98%;            /* Light text */
--card: 222.2 84% 4.9%;               /* Dark cards */  
--card-foreground: 210 40% 98%;       /* Light text on cards */
```

### Interactive Colors
```css
/* Primary Actions */
--primary: 222.2 47.4% 11.2%;         /* Dark blue */
--primary-foreground: 210 40% 98%;    /* Light text on primary */

/* Secondary Elements */
--secondary: 210 40% 96%;             /* Light gray */
--secondary-foreground: 222.2 84% 4.9%; /* Dark text on secondary */

/* Muted Elements */
--muted: 210 40% 96%;                 /* Subtle background */
--muted-foreground: 215.4 16.3% 46.9%; /* Muted text */

/* Accent Elements */
--accent: 210 40% 96%;                /* Accent background */
--accent-foreground: 222.2 84% 4.9%; /* Dark text on accent */
```

### Status Colors
```css
/* Destructive Actions */
--destructive: 0 84.2% 60.2%;         /* Red */
--destructive-foreground: 210 40% 98%; /* Light text on red */

/* Borders and Inputs */
--border: 214.3 31.8% 91.4%;         /* Subtle borders */
--input: 214.3 31.8% 91.4%;          /* Input borders */
--ring: 222.2 84% 4.9%;              /* Focus rings */
```

## Theme Usage Patterns

### Background Colors
```typescript
// ✅ Correct - Theme-aware
<div className="bg-background text-foreground">
<div className="bg-card text-card-foreground">
<div className="bg-muted text-muted-foreground">

// ❌ Incorrect - Hardcoded
<div className="bg-white text-black">
<div className="bg-gray-100 text-gray-900">
```

### Text Colors
```typescript
// ✅ Correct - Theme-aware
<h1 className="text-foreground">
<p className="text-muted-foreground">
<span className="text-primary">

// ❌ Incorrect - Hardcoded  
<h1 className="text-gray-900">
<p className="text-gray-600">
<span className="text-blue-600">
```

### Border Colors
```typescript
// ✅ Correct - Theme-aware
<div className="border border-border">
<input className="border border-input">

// ❌ Incorrect - Hardcoded
<div className="border border-gray-200">
<input className="border border-gray-300">
```

## Component Theme Implementation

### Button Theming
```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      }
    }
  }
);
```

### Card Theming
```typescript
const Card = ({ children, className, ...props }) => (
  <div
    className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}
    {...props}
  >
    {children}
  </div>
);
```

### Input Theming
```typescript
const Input = ({ className, ...props }) => (
  <input
    className={cn(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
);
```

## Theme Toggle Component

### Implementation
```typescript
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

### Usage in Layout
```typescript
const Header = () => (
  <header className="border-b border-border bg-background">
    <div className="flex items-center justify-between px-6 py-4">
      <h1 className="text-xl font-semibold text-foreground">
        Vehicle Parts Shop
      </h1>
      <div className="flex items-center gap-4">
        <ThemeToggle />
      </div>
    </div>
  </header>
);
```

## Migration Guide

### Step 1: Identify Hardcoded Colors
Search for common hardcoded patterns:
```bash
# Find hardcoded backgrounds
grep -r "bg-white\|bg-gray-" src/

# Find hardcoded text colors
grep -r "text-gray-\|text-black\|text-white" src/

# Find hardcoded borders
grep -r "border-gray-" src/
```

### Step 2: Replace with Theme Tokens
```typescript
// Before
className="bg-white text-gray-900 border border-gray-200"

// After  
className="bg-card text-card-foreground border border-border"
```

### Step 3: Test Theme Switching
1. Toggle between light/dark themes
2. Verify all components adapt properly
3. Check contrast ratios for accessibility
4. Test with system theme changes

## Common Migration Patterns

### Background Replacements
```typescript
// Cards and containers
bg-white → bg-card
bg-gray-50 → bg-muted  
bg-gray-100 → bg-secondary

// Page backgrounds
bg-gray-50 → bg-background
bg-white → bg-background
```

### Text Replacements
```typescript
// Primary text
text-gray-900 → text-foreground
text-black → text-foreground

// Secondary text  
text-gray-700 → text-foreground
text-gray-600 → text-muted-foreground
text-gray-500 → text-muted-foreground
text-gray-400 → text-muted-foreground
```

### Border Replacements
```typescript
// Standard borders
border-gray-200 → border-border
border-gray-300 → border-input

// Subtle borders
border-gray-100 → border-border
```

## Testing Themes

### Manual Testing Checklist
- [ ] Light theme displays correctly
- [ ] Dark theme displays correctly  
- [ ] System theme respects OS preference
- [ ] Theme toggle works smoothly
- [ ] No flash of incorrect theme on load
- [ ] All text is readable in both themes
- [ ] Interactive elements have proper contrast
- [ ] Focus states are visible

### Automated Testing
```typescript
// Theme context test
describe('ThemeProvider', () => {
  it('should provide theme context', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });
    
    expect(result.current.theme).toBeDefined();
    expect(result.current.setTheme).toBeInstanceOf(Function);
  });
});

// Component theme test  
describe('Button theming', () => {
  it('should apply theme-aware classes', () => {
    render(<Button variant="default">Test</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
  });
});
```

## Performance Considerations

### CSS Variable Optimization
- Use `color-scheme` for system integration
- Minimize CSS custom property lookups
- Cache theme calculations

### JavaScript Optimization
```typescript
// Memoize theme context value
const contextValue = useMemo(
  () => ({ theme, setTheme }),
  [theme, setTheme]
);

// Debounce theme changes
const debouncedSetTheme = useMemo(
  () => debounce(setTheme, 100),
  [setTheme]
);
```

## Accessibility Guidelines

### Contrast Requirements
- **Normal text**: 4.5:1 contrast ratio minimum
- **Large text**: 3:1 contrast ratio minimum  
- **Interactive elements**: 3:1 contrast ratio minimum

### Implementation
```css
/* Ensure sufficient contrast */
--foreground: 222.2 84% 4.9%;        /* High contrast on light background */
--muted-foreground: 215.4 16.3% 46.9%; /* Medium contrast for secondary text */
```

### Testing Tools
- **Chrome DevTools**: Contrast ratio checker
- **axe-core**: Automated accessibility testing
- **WAVE**: Web accessibility evaluation

## Troubleshooting

### Common Issues
1. **White backgrounds in dark theme**
   - Replace `bg-white` with `bg-card` or `bg-background`

2. **Unreadable text**
   - Use appropriate foreground colors with background colors
   - `bg-card` should pair with `text-card-foreground`

3. **Theme not persisting**
   - Check localStorage implementation
   - Verify theme provider wraps entire app

4. **Flash of wrong theme**
   - Implement theme detection before hydration
   - Use CSS to prevent initial flash

### Debug Commands
```javascript
// Check current theme
document.documentElement.classList.contains('dark')

// Inspect CSS variables
getComputedStyle(document.documentElement).getPropertyValue('--background')

// Test theme switching
document.documentElement.classList.toggle('dark')
```

## Future Enhancements

### Planned Features
1. **Custom theme creation**: User-defined color schemes
2. **High contrast mode**: Enhanced accessibility option
3. **Motion preferences**: Respect user motion settings
4. **Color blindness support**: Alternative color palettes

### Theme Extensions
```typescript
// Extended theme options
type Theme = 'light' | 'dark' | 'system' | 'high-contrast' | 'custom';

// Custom theme configuration
interface CustomTheme {
  name: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
}
```