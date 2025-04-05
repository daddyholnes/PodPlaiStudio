# PodPlay API Studio - UI Design Guide

This comprehensive guide outlines the design system, UI components, layout principles, and interaction patterns used in the PodPlay API Studio application. Future developers should follow these guidelines to maintain consistency when adding new features or tabs.

## Table of Contents
1. [Brand Identity](#brand-identity)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Layout Structure](#layout-structure)
5. [Component Library](#component-library)
6. [Interaction Patterns](#interaction-patterns)
7. [Responsive Design](#responsive-design)
8. [Accessibility Considerations](#accessibility-considerations)
9. [Dark Mode Implementation](#dark-mode-implementation)
10. [Adding New Features](#adding-new-features)

## Brand Identity

PodPlay API Studio is designed to mimic Google AI Studio with a clean, professional, and minimalist aesthetic. The brand identity focuses on:

- **Professional Feel**: Clean interfaces with ample whitespace
- **Google Design Language**: Following Material Design principles
- **Intuitive Navigation**: Self-explanatory UI with minimal learning curve
- **Focused Workspaces**: Content-first approach with minimized distractions

## Color System

The application uses a carefully curated color palette based on Google's design system, defined in both `theme.json` and `tailwind.config.ts`:

### Primary Colors
- **Primary Blue**: `#1a73e8` (Google Blue) - Used for primary actions, active states
- **Neutral Gray Scale**: Ranging from `#f8f9fa` (lightest) to `#202124` (darkest)
- **Status Colors**:
  - Success: `#1e8e3e` (Google Green)
  - Error: `#d93025` (Google Red)
  - Warning: `#f9ab00` (Google Yellow)

### Color Application Guidelines

- **Use primary blue** sparingly for important actions and selected states
- **Use neutral grays** for most UI elements, text, and backgrounds
- **Use status colors** only to indicate success, error, or warning states
- **Maintain sufficient contrast** between text and background (minimum 4.5:1 ratio)

## Typography

The type system uses Google's font family with a clear hierarchy:

### Font Families
- **Google Sans**: Used for headings, titles, and UI elements (`font-google-sans`)
- **Roboto**: Used for body text and longer content (`font-sans`)
- **Roboto Mono**: Used for code blocks and monospaced content (`font-mono`)

### Type Scale
- **Headings**:
  - H1: 24px / 1.5 line height / Google Sans Medium
  - H2: 20px / 1.5 line height / Google Sans Medium
  - H3: 16px / 1.5 line height / Google Sans Medium
- **Body Text**:
  - Large: 16px / 1.5 line height / Roboto Regular
  - Default: 14px / 1.5 line height / Roboto Regular
  - Small: 12px / 1.5 line height / Roboto Regular
- **UI Elements**:
  - Buttons: 14px / Google Sans Medium
  - Navigation: 14px / Google Sans Regular
  - Labels: 12px / Roboto Medium

## Layout Structure

The application follows a three-panel layout structure inspired by Google AI Studio:

```
+----------------+----------------------+------------------+
| Navigation Bar | Main Content Area    | Configuration    |
| (Vertical Tabs)| (Conversation/Editor)| Panel            |
|                |                      | (Parameters)     |
|                |                      |                  |
|                |                      |                  |
|                |                      |                  |
|                |                      |                  |
+----------------+----------------------+------------------+
```

### Key Layout Areas

1. **Navigation Sidebar (Left)**
   - Width: 64px (collapsed) / 240px (expanded)
   - Contains vertical mode tabs (Chat, Generate, Code, LiveAPI)
   - Model selection dropdown at top
   - User preferences/settings at bottom
   - Dark/light mode toggle

2. **Content Area (Center)**
   - Flexible width, expands to fill available space
   - Main workspace for conversation, content generation, code editing
   - Input area at bottom with send button
   - Message history scrolls vertically
   - Supports markdown, code blocks, and image rendering

3. **Configuration Panel (Right)**
   - Width: 320px (can be collapsed)
   - Contains model parameters (temperature, token limits)
   - System instructions input
   - Safety settings controls
   - Advanced options toggles
   - Sticky header with section name

### Spacing System

- **Base Unit**: 4px
- **Common Spacing Values**:
  - Extra Small: 4px (1 unit)
  - Small: 8px (2 units)
  - Medium: 16px (4 units)
  - Large: 24px (6 units)
  - Extra Large: 32px (8 units)
  - Huge: 48px (12 units)

### Layout Feel Guidelines

- **Airy and Spacious**: Use generous whitespace around content areas
- **Consistent Gutters**: Maintain 16px-24px gutters between major sections
- **Aligned Elements**: Keep elements aligned along invisible grid lines
- **Responsive Breakpoints**: Adapt layout at 768px, 1024px, and 1280px
- **Sticky Navigation**: Keep critical navigation elements visible during scrolling
- **Proportional Sizing**: Maintain visual hierarchy with proportional element sizing

## Component Library

The application uses Shadcn UI components with custom styling to match Google's design language:

### Buttons

```tsx
<Button variant="primary" size="default">Primary Action</Button>
<Button variant="secondary" size="default">Secondary Action</Button>
<Button variant="ghost" size="icon"><Icon name="settings" /></Button>
```

**Button Variants**:
- `primary`: Blue background, white text - Used for primary actions
- `secondary`: Light gray background, dark text - Used for secondary actions
- `outline`: Transparent with border - Used for optional actions
- `ghost`: Transparent with no border - Used for icon buttons
- `destructive`: Red background - Used for destructive actions

**Button Sizes**:
- `default`: Standard size (h-10)
- `sm`: Small size (h-8)
- `lg`: Large size (h-12)
- `icon`: Square icon button (w-10 h-10)

### Input Controls

```tsx
<Input placeholder="Enter text" />
<Textarea placeholder="Description" />
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

### Tabs and Navigation

Vertical tabs in the sidebar follow this structure:

```tsx
<Tabs orientation="vertical" defaultValue="chat">
  <TabsList>
    <TabsTrigger value="chat" tooltip="Chat">
      <MessageSquare className="w-5 h-5" />
    </TabsTrigger>
    <TabsTrigger value="generate" tooltip="Generate">
      <PenTool className="w-5 h-5" />
    </TabsTrigger>
    <!-- Additional tabs -->
  </TabsList>
  <TabsContent value="chat">
    <!-- Chat UI content -->
  </TabsContent>
  <!-- Additional content panels -->
</Tabs>
```

### Cards and Containers

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    <!-- Card content -->
  </CardContent>
  <CardFooter>
    <!-- Card footer actions -->
  </CardFooter>
</Card>
```

### Dialogs and Modals

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description text.</DialogDescription>
    </DialogHeader>
    <!-- Dialog content -->
    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>Cancel</Button>
      <Button onClick={onConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Interaction Patterns

### Loading States

- Use subtle loading indicators that don't disrupt the UI
- For buttons, show a spinner inside the button rather than disabling it
- For content areas, use skeleton loaders that match the expected content shape
- Avoid full-page loading screens when possible

```tsx
<Button disabled={isLoading}>
  {isLoading && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
  Submit
</Button>
```

### Form Validation

- Show validation errors inline, below the relevant input
- Use red text and border for error states
- Provide helpful error messages that guide users to fix the issue
- Validate on blur and submit, not on every keystroke

```tsx
<FormField
  control={form.control}
  name="username"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Username</FormLabel>
      <FormControl>
        <Input placeholder="Enter username" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Transitions and Animations

- Use subtle animations for state changes (150-300ms duration)
- Avoid animations that block user interaction
- Common transitions:
  - Fade in/out: opacity 0 → 1 (200ms)
  - Slide in/out: transform translateY/X (250ms)
  - Scale: transform scale (150ms)

```css
.fade-in {
  animation: fadeIn 200ms ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### Feedback and Toast Messages

- Use toast messages for non-critical feedback
- Position toasts in the bottom right corner
- Automatically dismiss after 5 seconds
- Include an action button or dismiss button when appropriate

```tsx
const { toast } = useToast()

toast({
  title: "Operation successful",
  description: "Your changes have been saved.",
  variant: "success",
  duration: 5000,
})
```

## Responsive Design

The application uses a mobile-first approach with breakpoints at:

- **sm**: 640px (Small devices)
- **md**: 768px (Medium devices)
- **lg**: 1024px (Large devices)
- **xl**: 1280px (Extra large devices)
- **2xl**: 1536px (2X large devices)

### Responsive Layout Changes

- **Mobile** (< 768px):
  - Sidebar collapses to bottom navigation bar
  - Configuration panel slides in as a modal
  - Full-width content area
  - Stacked forms and inputs

- **Tablet** (768px - 1023px):
  - Sidebar shows as icon-only (64px width)
  - Configuration panel can be toggled on/off
  - Reduced padding and margins

- **Desktop** (≥ 1024px):
  - Full three-panel layout
  - Expanded sidebar (240px width)
  - Visible configuration panel (320px width)
  - Generous padding and margins

## Accessibility Considerations

- Maintain a minimum text contrast ratio of 4.5:1
- Support keyboard navigation for all interactive elements
- Include proper ARIA attributes for custom components
- Ensure focus states are clearly visible
- Provide text alternatives for non-text content
- Design forms with clear labels and error messages

## Dark Mode Implementation

The application supports both light and dark modes using Tailwind's dark mode utilities:

### Theme Toggling

```tsx
const [isDarkMode, setIsDarkMode] = useState(
  window.matchMedia('(prefers-color-scheme: dark)').matches
)

const toggleDarkMode = () => {
  const newMode = !isDarkMode
  setIsDarkMode(newMode)
  document.documentElement.classList.toggle('dark', newMode)
}
```

### Color Application in Dark Mode

- **Light Mode**:
  - Background: White (#ffffff)
  - Text: Dark gray (#202124)
  - Borders: Light gray (#dadce0)

- **Dark Mode**:
  - Background: Dark gray (#202124)
  - Text: Light gray (#e8eaed)
  - Borders: Medium gray (#5f6368)

Always use the Tailwind dark mode variant for styling:

```tsx
<div className="bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white">
  Content
</div>
```

## Adding New Features

When adding new features or tabs to the application, follow these guidelines:

### Adding a New Tab

1. Add a new icon button to the vertical tabs in the sidebar
2. Create a new content component for the tab content
3. Update the routing to include the new tab
4. Add any necessary configuration options to the configuration panel

### Creating New Components

1. Follow the existing component structure and naming convention
2. Use the same styling approach with Tailwind classes
3. Leverage existing UI components when possible
4. Test across different screen sizes and in both light and dark modes

### Integration Checklist

- [ ] UI matches existing design language
- [ ] Component works in both light and dark modes
- [ ] Layout is responsive across all breakpoints
- [ ] Accessibility requirements are met
- [ ] Performance is optimized (no unnecessary re-renders)
- [ ] Error states and loading states are handled
- [ ] Animation and transitions match existing patterns

---

By following this guide, you'll ensure that new features and tabs integrate seamlessly with the existing PodPlay API Studio design system while maintaining the Google AI Studio-inspired look and feel.
