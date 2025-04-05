import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/sidebar";
import ChatView from "@/components/chat-view";
import GenerateView from "@/components/generate-view";
import CodeView from "@/components/code-view";
import LiveApiView from "@/components/live-api-view";
import ConfigPanel from "@/components/config-panel";
import ErrorBoundary from "@/components/error-boundary";
import { ThemeProvider } from "@/contexts/theme-context";
import { GeminiProvider } from "@/contexts/gemini-context";
import { ConversationsProvider } from "@/contexts/conversations-context";

function MainLayout() {
  const [activeTab, setActiveTab] = useState<'chat' | 'generate' | 'code' | 'liveapi'>('chat');

  // Handle tab change events from sidebar
  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('change-tab', handleTabChange as EventListener);
    
    return () => {
      window.removeEventListener('change-tab', handleTabChange as EventListener);
    };
  }, []);

  return (
    <div className="flex h-screen dark:dark">
      <ErrorBoundary>
        <Sidebar activeTab={activeTab} />
      </ErrorBoundary>
      
      <div className="flex-grow flex flex-col h-full overflow-hidden bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200">
        {/* Main Content with Split Panels */}
        <div className="flex-grow flex overflow-hidden">
          {/* Display the active tab content */}
          <div className="flex-grow flex flex-col overflow-hidden">
            <ErrorBoundary>
              {activeTab === 'chat' && <ChatView />}
              {activeTab === 'generate' && <GenerateView />}
              {activeTab === 'code' && <CodeView />}
              {activeTab === 'liveapi' && <LiveApiView />}
            </ErrorBoundary>
          </div>
          
          {/* Configuration Panel */}
          <ErrorBoundary>
            <ConfigPanel />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <GeminiProvider>
        <ConversationsProvider>
          <div className="font-roboto">
            <Switch>
              <Route path="/" component={MainLayout} />
              <Route component={NotFound} />
            </Switch>
            <Toaster />
          </div>
        </ConversationsProvider>
      </GeminiProvider>
    </ThemeProvider>
  );
}

export default App;
