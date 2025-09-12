# POS Keyboard Shortcuts System

This document provides comprehensive information about the keyboard shortcuts system implemented for the Point of Sale (POS) interface.

## Overview

The POS keyboard shortcuts system enhances usability and accessibility by providing efficient keyboard navigation and shortcuts for common actions. The system is designed to comply with WCAG 2.1 accessibility standards and works across all modern browsers.

## Key Features

- **Context-aware shortcuts**: Different shortcuts available based on current screen/component
- **Visual indicators**: Keyboard shortcut badges on buttons and tooltips
- **Screen reader support**: Announcements for shortcut activation and navigation changes
- **Focus management**: Proper focus handling for keyboard navigation
- **Accessibility compliance**: WCAG 2.1 compliant implementation

## Global Shortcuts

These shortcuts work from anywhere in the POS system:

| Shortcut | Action | Description |
|----------|--------|-------------|
| `F1` | New Session | Creates a new POS session |
| `F2` | Focus Product Search | Moves focus to product search field |
| `F3` | Focus Customer Search | Moves focus to customer selection |
| `F4` | Process Payment | Initiates payment when cart has items |
| `Tab` | Navigate Next | Moves to next section in tab order |
| `Shift+Tab` | Navigate Previous | Moves to previous section in tab order |
| `Escape` | Cancel/Close | Cancels current action or closes modals |

## Session Management Shortcuts

For managing multiple POS sessions:

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+1` | Switch to Session 1 | Activates session 1 |
| `Ctrl+2` | Switch to Session 2 | Activates session 2 |
| `Ctrl+3` | Switch to Session 3 | Activates session 3 |
| `Ctrl+4` | Switch to Session 4 | Activates session 4 |
| `Ctrl+5` | Switch to Session 5 | Activates session 5 |
| `Ctrl+W` | Close Session | Closes current session (if multiple exist) |

## Product Search Shortcuts

When product search is active:

| Shortcut | Action | Description |
|----------|--------|-------------|
| `↓` | Navigate Down | Moves to next product in search results |
| `↑` | Navigate Up | Moves to previous product in search results |
| `Enter` | Select Product | Adds highlighted product to cart |
| `Escape` | Clear Search | Clears search results and closes dropdown |

## Customer Selection Shortcuts

When customer selection is active:

| Shortcut | Action | Description |
|----------|--------|-------------|
| `↓` | Navigate Down | Moves to next customer in list |
| `↑` | Navigate Up | Moves to previous customer in list |
| `Enter` | Select Customer | Selects highlighted customer |
| `Escape` | Clear Selection | Clears customer selection or closes dropdown |

## Shopping Cart Shortcuts

When shopping cart is focused:

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Delete` | Remove Item | Removes selected item from cart |
| `+` | Increase Quantity | Increases quantity of selected item |
| `-` | Decrease Quantity | Decreases quantity of selected item |
| `Enter` | Proceed to Checkout | Initiates checkout process |

## Payment Form Shortcuts

During payment processing:

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Enter` | Complete Payment | Processes payment when amount is sufficient |
| `Escape` | Return to Cart | Cancels payment and returns to cart |
| `Tab` | Navigate Fields | Moves between payment form fields |

## Implementation Details

### Architecture

The keyboard shortcuts system is built using several key components:

1. **useKeyboardShortcuts Hook** (`/frontend/src/hooks/useKeyboardShortcuts.ts`)
   - Central hook for managing keyboard shortcuts
   - Context-aware shortcut handling
   - Event listeners with proper cleanup

2. **Keyboard Shortcut UI Components** (`/frontend/src/components/ui/keyboard-shortcut-badge.tsx`)
   - Visual shortcut indicators
   - Tooltips with shortcut information
   - Floating shortcuts help panel

3. **Screen Reader Support** (`/frontend/src/components/ui/screen-reader-announcements.tsx`)
   - Accessibility announcements
   - Screen reader integration
   - High contrast and reduced motion support

### Context System

The shortcuts system uses contexts to provide different shortcuts based on the current interface state:

- `GLOBAL`: Available everywhere in POS
- `PRODUCT_SEARCH`: Active during product searching
- `CUSTOMER_SELECT`: Active during customer selection
- `SHOPPING_CART`: Active when cart is focused
- `PAYMENT`: Active during payment processing
- `SESSION_MANAGEMENT`: Session-specific shortcuts

### Integration Example

```typescript
import { 
  useKeyboardShortcuts, 
  SHORTCUT_CONTEXTS,
  type ShortcutHandlers 
} from '@/hooks'

function MyPOSComponent() {
  const shortcutHandlers: ShortcutHandlers = {
    onNewSession: () => createNewSession(),
    onFocusProductSearch: () => focusProductSearch(),
    // ... other handlers
  }

  useKeyboardShortcuts({
    context: SHORTCUT_CONTEXTS.GLOBAL,
    handlers: shortcutHandlers,
    enabled: true
  })

  // Component JSX...
}
```

## Accessibility Features

### WCAG 2.1 Compliance

The system meets the following WCAG 2.1 criteria:

- **2.1.1 Keyboard**: All functionality is keyboard accessible
- **2.1.2 No Keyboard Trap**: Users can navigate away from any component using keyboard
- **2.4.1 Bypass Blocks**: Skip links provided for main content areas
- **2.4.3 Focus Order**: Logical focus order maintained
- **2.4.7 Focus Visible**: Clear visual focus indicators
- **3.3.2 Labels or Instructions**: Clear labeling of shortcut functionality

### Screen Reader Support

- **Announcements**: Actions announced when shortcuts are activated
- **Labels**: Proper ARIA labels for all interactive elements
- **Key shortcuts**: `aria-keyshortcuts` attributes on relevant elements
- **Live regions**: Dynamic content changes announced to screen readers

### Visual Indicators

- **Shortcut badges**: Small badges showing keyboard shortcuts on buttons
- **Tooltips**: Detailed tooltips with shortcut information
- **Focus indicators**: Clear visual focus indicators for keyboard navigation
- **High contrast support**: Works with high contrast mode

## Browser Compatibility

The keyboard shortcuts system is tested and supported on:

- **Chrome**: Version 90+
- **Firefox**: Version 88+
- **Safari**: Version 14+
- **Edge**: Version 90+

### Known Issues

- Some function keys (F1, F11, F12) may conflict with browser shortcuts in certain browsers
- Prevention mechanisms are in place but users should be aware of potential conflicts

## Testing

### Automated Testing

Use the provided test utilities:

```typescript
import { KeyboardShortcutsTestRunner } from '@/utils/keyboard-shortcuts-test'

const testRunner = new KeyboardShortcutsTestRunner()

// Run all tests
const results = await testRunner.runAllTests()

// Test browser compatibility
const browserResults = await testRunner.testBrowserCompatibility()
```

### Manual Testing Checklist

1. **Function Key Shortcuts**
   - [ ] F1 creates new session
   - [ ] F2 focuses product search
   - [ ] F3 focuses customer selection
   - [ ] F4 initiates payment (when cart has items)

2. **Navigation**
   - [ ] Tab moves through interface in logical order
   - [ ] Shift+Tab moves backward through interface
   - [ ] Arrow keys navigate within lists/dropdowns
   - [ ] Enter selects items/confirms actions
   - [ ] Escape cancels actions/closes dialogs

3. **Session Management**
   - [ ] Ctrl+1-5 switches between sessions
   - [ ] Session numbers display on tabs
   - [ ] Ctrl+W closes session (when multiple exist)

4. **Accessibility**
   - [ ] Focus indicators visible
   - [ ] Screen reader announces shortcuts
   - [ ] Skip links work properly
   - [ ] High contrast mode supported
   - [ ] No keyboard traps exist

5. **Visual Indicators**
   - [ ] Shortcut badges display on buttons
   - [ ] Tooltips show shortcut information
   - [ ] Floating shortcuts panel shows context shortcuts
   - [ ] Visual feedback for shortcut activation

## Troubleshooting

### Common Issues

1. **Shortcuts not working**
   - Check if the component is properly focused
   - Verify the context is correctly set
   - Ensure preventDefault is not interfering

2. **Focus not visible**
   - Check CSS focus styles are applied
   - Verify focus-visible polyfill is loaded
   - Test with different browsers

3. **Screen reader not announcing**
   - Check ARIA live regions are present
   - Verify announcements are being triggered
   - Test with different screen readers

### Debug Mode

Enable debug logging for keyboard shortcuts:

```typescript
// In browser console
localStorage.setItem('debug-keyboard-shortcuts', 'true')

// This will log all shortcut events to console
```

## Performance Considerations

- **Event Listener Management**: Automatic cleanup prevents memory leaks
- **Context Switching**: Minimal overhead when switching between contexts
- **Visual Updates**: Shortcut indicators update efficiently
- **Bundle Size**: Keyboard shortcuts add approximately 15KB to bundle

## Future Enhancements

Planned improvements include:

1. **Customizable Shortcuts**: Allow users to customize keyboard shortcuts
2. **Gesture Support**: Touch gesture equivalents for shortcuts
3. **Voice Commands**: Voice command integration
4. **Advanced Navigation**: More sophisticated navigation patterns
5. **Analytics**: Track shortcut usage for optimization

## Development Guidelines

### Adding New Shortcuts

1. Define the shortcut in the appropriate context in `KEYBOARD_SHORTCUTS`
2. Add the handler interface to `ShortcutHandlers`
3. Implement the action in the component
4. Add visual indicators and tooltips
5. Update documentation and tests

### Best Practices

- Always provide visual indicators for shortcuts
- Include tooltip with shortcut information
- Test with keyboard-only navigation
- Verify screen reader compatibility
- Consider international keyboard layouts
- Avoid conflicts with browser shortcuts

## Support

For issues or questions regarding the keyboard shortcuts system:

1. Check this documentation first
2. Run the automated test suite
3. Review the troubleshooting section
4. File an issue with detailed reproduction steps

---

*Last updated: December 2024*