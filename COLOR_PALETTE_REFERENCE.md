# PodPlay API Studio - Color Palette Reference

This document provides a quick reference for the color palette used in the PodPlay API Studio UI, which is designed to match Google AI Studio's visual style.

## Primary Color Palette

### Core Brand Colors

| Color Name | Hex Value | Usage |
|------------|-----------|-------|
| Primary Blue | `#1a73e8` | Primary actions, selected states, focus indicators |
| Primary Blue (Light) | `#d2e3fc` | Hover states, backgrounds for selected items |
| Primary Blue (Dark) | `#1257a9` | Pressed states, active elements |

### Neutral Colors

| Color Name | Hex Value | Usage |
|------------|-----------|-------|
| White | `#ffffff` | Background (light mode) |
| Gray 50 | `#f8f9fa` | Alternative background, hover states (light mode) |
| Gray 100 | `#f1f3f4` | Subtle elements, dividers, disabled states (light mode) |
| Gray 200 | `#e8eaed` | Borders, separators (light mode) |
| Gray 300 | `#dadce0` | Disabled text, placeholders (light mode) |
| Gray 400 | `#bdc1c6` | Secondary text, less important content (light mode) |
| Gray 500 | `#9aa0a6` | Icons, secondary text (light mode) |
| Gray 600 | `#80868b` | Text, icons (dark mode) |
| Gray 700 | `#5f6368` | Primary text (light mode), secondary elements (dark mode) |
| Gray 800 | `#3c4043` | Emphasis text (light mode), primary elements (dark mode) |
| Gray 900 | `#202124` | High emphasis text (light mode), background (dark mode) |
| Black | `#000000` | Highest contrast text (light mode) |

### Status Colors

| Color Name | Hex Value | Usage |
|------------|-----------|-------|
| Success | `#1e8e3e` | Success messages, confirmations |
| Success (Light) | `#e6f4ea` | Success message backgrounds |
| Error | `#d93025` | Error messages, destructive actions |
| Error (Light) | `#fce8e6` | Error message backgrounds |
| Warning | `#f9ab00` | Warning messages, attention required |
| Warning (Light) | `#fef7e0` | Warning message backgrounds |

## Color Usage Guidelines

### Text Colors

| Context | Light Mode | Dark Mode |
|---------|------------|-----------|
| Primary Text | Gray 900 (`#202124`) | Gray 200 (`#e8eaed`) |
| Secondary Text | Gray 700 (`#5f6368`) | Gray 400 (`#bdc1c6`) |
| Disabled Text | Gray 400 (`#bdc1c6`) | Gray 600 (`#80868b`) |
| Link Text | Primary Blue (`#1a73e8`) | Primary Blue Light (`#8ab4f8`) |
| Error Text | Error (`#d93025`) | Error Light (`#f28b82`) |

### Background Colors

| Context | Light Mode | Dark Mode |
|---------|------------|-----------|
| Main Background | White (`#ffffff`) | Gray 900 (`#202124`) |
| Secondary Background | Gray 50 (`#f8f9fa`) | Gray 800 (`#3c4043`) |
| Elevated Elements | White (`#ffffff`) | Gray 800 (`#3c4043`) |
| Selected Background | Primary Blue Light (`#d2e3fc`) | Primary Blue Dark (`#1a73e8` at 30% opacity) |

### Border Colors

| Context | Light Mode | Dark Mode |
|---------|------------|-----------|
| Dividers | Gray 200 (`#e8eaed`) | Gray 700 (`#5f6368`) |
| Input Borders | Gray 300 (`#dadce0`) | Gray 600 (`#80868b`) |
| Focus Borders | Primary Blue (`#1a73e8`) | Primary Blue (`#1a73e8`) |

### Button Colors

| Button Type | Background | Text | Border |
|-------------|------------|------|--------|
| Primary | Primary Blue (`#1a73e8`) | White (`#ffffff`) | None |
| Secondary | Gray 50 (`#f8f9fa`) / Gray 800 (`#3c4043`) in dark mode | Gray 900 (`#202124`) / White (`#ffffff`) in dark mode | Gray 200 (`#e8eaed`) / Gray 700 (`#5f6368`) in dark mode |
| Outline | Transparent | Primary Blue (`#1a73e8`) | Primary Blue (`#1a73e8`) |
| Ghost | Transparent | Gray 700 (`#5f6368`) / Gray 300 (`#dadce0`) in dark mode | None |
| Destructive | Error (`#d93025`) | White (`#ffffff`) | None |

## Tailwind Color Classes

### Common Tailwind Color Classes

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Main background | `bg-white` | `dark:bg-neutral-900` |
| Primary text | `text-neutral-900` | `dark:text-white` |
| Secondary text | `text-neutral-700` | `dark:text-neutral-400` |
| Primary button | `bg-primary-500 text-white` | `bg-primary-500 text-white` |
| Secondary button | `bg-neutral-100 text-neutral-900` | `dark:bg-neutral-800 dark:text-white` |
| Borders | `border-neutral-300` | `dark:border-neutral-700` |
| Dividers | `border-neutral-200` | `dark:border-neutral-800` |
| Input fields | `bg-neutral-100 border-neutral-300` | `dark:bg-neutral-800 dark:border-neutral-700` |

### Example Usage in Components

```tsx
// Button with primary styling
<button className="bg-primary-500 hover:bg-primary-600 text-white rounded-md px-4 py-2">
  Submit
</button>

// Secondary button with dark mode support
<button className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-white rounded-md px-4 py-2">
  Cancel
</button>

// Card component with dark mode support
<div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm p-4">
  <h3 className="text-neutral-900 dark:text-white text-lg font-medium">Card Title</h3>
  <p className="text-neutral-700 dark:text-neutral-400 mt-2">Card content</p>
</div>

// Input field
<input 
  className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 text-neutral-900 dark:text-white"
  placeholder="Enter text"
/>
```

## Color in Theme.json

The application's core branding color is defined in `theme.json`:

```json
{
  "variant": "tint",
  "primary": "#1a73e8", 
  "appearance": "system",
  "radius": 0.5
}
```

This configuration:
- Sets the primary color to Google Blue (`#1a73e8`)
- Uses the "tint" variant for color application
- Uses system preference for light/dark mode
- Sets a moderate border radius (0.5)

## Google AI Studio Color Matching

This color palette has been carefully selected to match Google AI Studio's interface, providing a familiar experience for users. When adding new features or components, try to match the existing Google AI Studio interface for consistency.

---

For more comprehensive style guidance, refer to the UI_DESIGN_GUIDE.md document.
