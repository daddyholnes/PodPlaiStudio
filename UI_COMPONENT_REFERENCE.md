# PodPlay API Studio - UI Component Reference

This document provides a quick reference for the component hierarchy and file structure of the PodPlay API Studio UI. It complements the more detailed UI_DESIGN_GUIDE.md by showing the actual implementation structure.

## Component Hierarchy

```
App
├── MainLayout
│   ├── Sidebar
│   │   ├── SidebarHeader
│   │   │   └── ModelSelector
│   │   ├── VerticalTabs
│   │   │   ├── ChatTab
│   │   │   ├── GenerateTab
│   │   │   ├── CodeTab
│   │   │   └── LiveAPITab
│   │   └── SidebarFooter
│   │       └── ThemeToggle
│   ├── MainContent
│   │   ├── ChatView
│   │   │   ├── MessageList
│   │   │   │   └── Message (User/Assistant)
│   │   │   └── ChatInput
│   │   ├── GenerateView
│   │   │   ├── PromptEditor
│   │   │   └── GeneratedContent
│   │   ├── CodeView
│   │   │   ├── CodeEditor
│   │   │   └── CodeOutput
│   │   └── LiveAPIView
│   │       ├── MediaControls
│   │       ├── LiveFeed
│   │       └── ResponseArea
│   └── ConfigPanel
│       ├── ConfigHeader
│       ├── ModelParameters
│       │   ├── TemperatureSlider
│       │   ├── MaxTokensInput
│       │   ├── TopPSlider
│       │   └── TopKSlider
│       ├── SystemInstructions
│       └── SafetySettings
```

## Key File Locations

### Core Layout and Navigation

- `client/src/App.tsx` - Main application component and routing
- `client/src/components/sidebar.tsx` - Left navigation sidebar
- `client/src/components/config-panel.tsx` - Right configuration panel

### View Components

- `client/src/components/chat-view.tsx` - Chat conversation interface
- `client/src/components/generate-view.tsx` - Text generation interface
- `client/src/components/code-view.tsx` - Code generation and execution interface
- `client/src/components/liveapi-view.tsx` - Real-time media interaction interface

### UI Components

- `client/src/components/ui/` - Reusable UI components 
  - `button.tsx` - Button components
  - `tabs.tsx` - Tab navigation components
  - `input.tsx` - Input components
  - `select.tsx` - Dropdown components
  - `slider.tsx` - Slider components
  - `card.tsx` - Card container components
  - `dialog.tsx` - Modal dialog components
  - `textarea.tsx` - Multiline text input components
  - `tooltip.tsx` - Tooltip components
  - `sidebar.tsx` - Sidebar layout components
  - `form.tsx` - Form related components

### State Management

- `client/src/contexts/gemini-context.tsx` - API and model configuration context
- `client/src/contexts/conversations-context.tsx` - Conversation management context
- `client/src/contexts/theme-context.tsx` - Theme and appearance management

### API Services

- `client/src/lib/api.ts` - API client functions
- `server/gemini.ts` - Gemini API integration
- `server/routes.ts` - Server API routes

### Theme and Styling

- `theme.json` - Central theme configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `client/src/index.css` - Global CSS styles 

## Component Usage Examples

### Using the Button Component

```tsx
import { Button } from "@/components/ui/button"

// Primary button
<Button variant="primary">Submit</Button>

// Secondary button
<Button variant="secondary">Cancel</Button>

// Icon button
<Button variant="ghost" size="icon">
  <Settings className="h-4 w-4" />
</Button>
```

### Using the Tabs Component

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

<Tabs defaultValue="chat" orientation="vertical">
  <TabsList>
    <TabsTrigger value="chat">
      <MessageSquare className="h-5 w-5" />
      <span>Chat</span>
    </TabsTrigger>
    <TabsTrigger value="generate">
      <PenTool className="h-5 w-5" />
      <span>Generate</span>
    </TabsTrigger>
  </TabsList>
  <TabsContent value="chat">
    <ChatView />
  </TabsContent>
  <TabsContent value="generate">
    <GenerateView />
  </TabsContent>
</Tabs>
```

### Using Forms

```tsx
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const formSchema = z.object({
  prompt: z.string().min(1, "Prompt is required")
})

const PromptForm = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: ""
    }
  })

  const onSubmit = (data) => {
    // Handle form submission
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prompt</FormLabel>
              <FormControl>
                <Input placeholder="Enter your prompt..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Generate</Button>
      </form>
    </Form>
  )
}
```

## Component Extension Guidelines

When creating new components:

1. Follow the existing naming convention and file structure
2. Extend existing components when possible rather than creating from scratch
3. Use the same styling approach with Tailwind classes
4. Follow the React hooks pattern for state management
5. Use the shadcn component architecture with forwardRef when appropriate
6. Maintain proper TypeScript types and interfaces

For more detailed styling guidelines, refer to the comprehensive UI_DESIGN_GUIDE.md document.
