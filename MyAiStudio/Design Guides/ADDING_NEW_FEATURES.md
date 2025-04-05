# PodPlay API Studio - Adding New Features Guide

This guide provides specific instructions for adding new tabs, features, and functionality to the PodPlay API Studio application. It's intended for future developers who want to extend the application while maintaining the same look and feel.

## Table of Contents
1. [Adding a New Tab](#adding-a-new-tab)
2. [Creating New View Components](#creating-new-view-components)
3. [Adding Configuration Options](#adding-configuration-options)
4. [Backend API Extensions](#backend-api-extensions)
5. [Testing New Features](#testing-new-features)

## Adding a New Tab

The PodPlay API Studio uses a vertical tab navigation in the sidebar, similar to Google AI Studio. Here's how to add a new tab:

### Step 1: Add Tab Icon and Label to the Sidebar

In the sidebar component (`client/src/components/sidebar.tsx`), add a new tab trigger:

```tsx
// Import your icon
import { YourNewIcon } from "lucide-react";

// Inside the Tabs component
<TabsTrigger 
  value="newFeature" 
  className="flex flex-col items-center justify-center w-full p-3"
  title="New Feature"
>
  <YourNewIcon className="w-5 h-5" />
  <span className="mt-1 text-xs font-medium">New Feature</span>
</TabsTrigger>
```

### Step 2: Create a New View Component

Create a new view component for your tab content:

```tsx
// client/src/components/new-feature-view.tsx
import React from "react";

const NewFeatureView: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4">
        <h2 className="text-2xl font-google-sans font-medium mb-4">New Feature</h2>
        {/* Your new feature content here */}
      </div>
    </div>
  );
};

export default NewFeatureView;
```

### Step 3: Add the Content to the TabsContent

Add a new TabsContent component for your new feature:

```tsx
<TabsContent value="newFeature" className="flex-1 overflow-hidden">
  <NewFeatureView />
</TabsContent>
```

### Step 4: Update the Tab State Management

If you have tab state management in your application, update it to handle the new tab:

```tsx
// In your tabs state management
const [activeTab, setActiveTab] = useState("chat");
// Add your new tab to any tab-related logic
const tabs = ["chat", "generate", "code", "liveapi", "newFeature"];
```

## Creating New View Components

When creating new view components for your features, follow these guidelines:

### Basic Component Structure

```tsx
// client/src/components/your-component.tsx
import React from "react";
import { useGeminiContext } from "@/contexts/gemini-context";

const YourComponent: React.FC = () => {
  // Access shared state if needed
  const { modelConfig } = useGeminiContext();
  
  // Component state
  const [localState, setLocalState] = useState(initialValue);
  
  // Component logic
  const handleAction = () => {
    // Implementation
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Your component UI */}
    </div>
  );
};

export default YourComponent;
```

### Styles and Layout

Follow the established layout patterns:

```tsx
<div className="flex flex-col h-full">
  {/* Header area */}
  <div className="border-b border-neutral-300 dark:border-neutral-800 p-4">
    <h2 className="text-xl font-google-sans font-medium">Feature Title</h2>
  </div>
  
  {/* Main content area - scrollable */}
  <div className="flex-1 overflow-auto p-4">
    {/* Your main content */}
  </div>
  
  {/* Footer/controls area */}
  <div className="border-t border-neutral-300 dark:border-neutral-800 p-4">
    {/* Action buttons, inputs, etc. */}
    <Button variant="primary" onClick={handleAction}>
      Action
    </Button>
  </div>
</div>
```

## Adding Configuration Options

New features often require configuration options, which should be added to the ConfigPanel component.

### Step 1: Define Configuration Schema

Add your feature's configuration options to the shared schema:

```tsx
// shared/schema.ts
export const ModelParametersSchema = z.object({
  // Existing parameters
  temperature: z.number().min(0).max(1).default(0.7),
  maxTokens: z.number().min(1).max(32768).default(2048),
  
  // Your new parameters
  yourNewParameter: z.number().min(0).max(10).default(5),
  yourToggleOption: z.boolean().default(false),
});
```

### Step 2: Add UI Controls to ConfigPanel

Add your new configuration options to the ConfigPanel:

```tsx
// client/src/components/config-panel.tsx

// Inside the ConfigPanel component
const { modelConfig, updateModelConfig } = useGeminiContext();

// Add your new UI controls
<div className="space-y-4">
  <div>
    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-400 block mb-2">
      Your New Parameter
    </label>
    <Slider 
      min={0}
      max={10}
      step={1}
      value={[modelConfig.yourNewParameter]}
      onValueChange={(value) => updateModelConfig({ yourNewParameter: value[0] })}
    />
    <div className="flex justify-between text-xs text-neutral-500 mt-1">
      <span>0</span>
      <span>10</span>
    </div>
  </div>
  
  <div className="flex items-center justify-between">
    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-400">
      Your Toggle Option
    </label>
    <Switch
      checked={modelConfig.yourToggleOption}
      onCheckedChange={(checked) => updateModelConfig({ yourToggleOption: checked })}
    />
  </div>
</div>
```

## Backend API Extensions

If your feature requires new backend functionality, follow these steps:

### Step 1: Add New API Routes

Add new routes to the server's routes file:

```tsx
// server/routes.ts
// Inside the registerRoutes function:

// Add a new API endpoint
app.post("/api/your-feature", async (req, res) => {
  try {
    const { param1, param2 } = req.body;
    
    // Your implementation logic
    const result = await yourFeatureImplementation(param1, param2);
    
    res.json({ result });
  } catch (error) {
    console.error("Error in your feature:", error);
    res.status(500).json({ error: error.message });
  }
});
```

### Step 2: Implement the Backend Logic

Create modules for your backend logic:

```tsx
// server/your-feature.ts
import { GEMINI_API_KEY, GEMINI_API_BASE_URL } from "./config";

export async function yourFeatureImplementation(param1, param2) {
  // Your implementation here, e.g. API calls, data processing
  
  // If calling Gemini API:
  const response = await fetch(`${GEMINI_API_BASE_URL}/models/${modelId}:yourMethod`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GEMINI_API_KEY}`
    },
    body: JSON.stringify({
      // Request parameters
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API error: ${error.error.message}`);
  }
  
  return await response.json();
}
```

### Step 3: Create Frontend API Clients

Add client-side functions to call your new API endpoints:

```tsx
// client/src/lib/api.ts
export async function callYourFeature(param1, param2) {
  const response = await fetch("/api/your-feature", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ param1, param2 })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "An unknown error occurred");
  }
  
  return await response.json();
}
```

## Testing New Features

Before finalizing your new feature, test it thoroughly:

### UI Testing Checklist

- [ ] Test in both light and dark modes
- [ ] Test across all responsive breakpoints (mobile, tablet, desktop)
- [ ] Verify all animations and transitions work smoothly
- [ ] Test keyboard navigation
- [ ] Ensure proper focus management
- [ ] Check for any console errors

### Functionality Testing Checklist

- [ ] Test all the main user flows and interactions
- [ ] Verify integration with existing features
- [ ] Test with different model configurations
- [ ] Check error handling and edge cases
- [ ] Verify real-time updates work correctly

### Integration Testing Checklist

- [ ] Make sure your feature doesn't break existing functionality
- [ ] Verify that shared state is properly managed
- [ ] Test transitions between your feature and other features
- [ ] Check performance impact of your feature

### Final Verification

Before submitting your changes:

1. Restart the application and verify everything loads correctly
2. Check that all your UI components match the existing design system
3. Verify that your feature follows all accessibility guidelines
4. Test the whole application flow to ensure nothing was broken

## Example: Adding a "Tools" Tab

Let's walk through a complete example of adding a hypothetical "Tools" tab:

### 1. Add the Tab to the Sidebar

```tsx
// client/src/components/sidebar.tsx
import { Tool } from "lucide-react";

// Inside the TabsList
<TabsTrigger 
  value="tools" 
  className="flex flex-col items-center justify-center w-full p-3"
  title="Tools"
>
  <Tool className="w-5 h-5" />
  <span className="mt-1 text-xs font-medium">Tools</span>
</TabsTrigger>
```

### 2. Create the View Component

```tsx
// client/src/components/tools-view.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGeminiContext } from "@/contexts/gemini-context";

const ToolsView: React.FC = () => {
  const { modelConfig } = useGeminiContext();
  const [toolInput, setToolInput] = useState("");
  const [toolResult, setToolResult] = useState("");
  
  const handleToolAction = async () => {
    try {
      // Call your API
      const result = await callToolsFeature(toolInput, modelConfig.model);
      setToolResult(result.output);
    } catch (error) {
      console.error("Tool error:", error);
      setToolResult("Error: " + error.message);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-neutral-300 dark:border-neutral-800 p-4">
        <h2 className="text-xl font-google-sans font-medium">Tools</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Special tools powered by Gemini API
        </p>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Sample Tool</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={toolInput}
                onChange={(e) => setToolInput(e.target.value)}
                placeholder="Enter input for tool..."
                className="mb-4"
              />
              <Button onClick={handleToolAction}>Run Tool</Button>
              
              {toolResult && (
                <div className="mt-4 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                  <pre className="whitespace-pre-wrap">{toolResult}</pre>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Add more tool cards here */}
        </div>
      </div>
    </div>
  );
};

export default ToolsView;
```

### 3. Add the Tab Content

```tsx
// In your main content area
<TabsContent value="tools" className="flex-1 overflow-hidden">
  <ToolsView />
</TabsContent>
```

### 4. Add API Support

```tsx
// server/routes.ts
app.post("/api/tools", async (req, res) => {
  try {
    const { input, modelId } = req.body;
    
    // Call Gemini API with the appropriate parameters
    const result = await callGeminiToolsAPI(input, modelId);
    
    res.json({ output: result.output });
  } catch (error) {
    console.error("Tools API error:", error);
    res.status(500).json({ error: error.message });
  }
});
```

By following these patterns, you can seamlessly add new features to the PodPlay API Studio while maintaining the consistent design and functionality.

---

For more detailed styling guidance, refer to the UI_DESIGN_GUIDE.md and COLOR_PALETTE_REFERENCE.md documents.
