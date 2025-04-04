import { useState } from "react";
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

  return (
    <div className="flex h-screen dark:dark">
      <ErrorBoundary>
        <Sidebar activeTab={activeTab} />
      </ErrorBoundary>
      
      <div className="flex-grow flex flex-col h-full overflow-hidden bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200">
        {/* Navigation Tabs */}
        <div className="border-b border-neutral-300 dark:border-neutral-700">
          <nav className="flex">
            <button 
              className={`px-6 py-3 flex items-center ${
                activeTab === 'chat' 
                  ? 'text-neutral-700 dark:text-neutral-300 border-b-2 border-primary relative' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-b-2 border-transparent'
              }`}
              onClick={() => setActiveTab('chat')}
            >
              <span className="material-icons mr-2 text-base">chat</span>
              <span className="font-google-sans">Chat</span>
            </button>
            
            <button 
              className={`px-6 py-3 flex items-center ${
                activeTab === 'generate' 
                  ? 'text-neutral-700 dark:text-neutral-300 border-b-2 border-primary relative' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-b-2 border-transparent'
              }`}
              onClick={() => setActiveTab('generate')}
            >
              <span className="material-icons mr-2 text-base">text_fields</span>
              <span className="font-google-sans">Generate</span>
            </button>
            
            <button 
              className={`px-6 py-3 flex items-center ${
                activeTab === 'code' 
                  ? 'text-neutral-700 dark:text-neutral-300 border-b-2 border-primary relative' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-b-2 border-transparent'
              }`}
              onClick={() => setActiveTab('code')}
            >
              <span className="material-icons mr-2 text-base">code</span>
              <span className="font-google-sans">Code</span>
            </button>
            
            <button 
              className={`px-6 py-3 flex items-center ${
                activeTab === 'liveapi' 
                  ? 'text-neutral-700 dark:text-neutral-300 border-b-2 border-primary relative' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-b-2 border-transparent'
              }`}
              onClick={() => setActiveTab('liveapi')}
            >
              <span className="material-icons mr-2 text-base">api</span>
              <span className="font-google-sans">LiveAPI</span>
            </button>
          </nav>
        </div>

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
