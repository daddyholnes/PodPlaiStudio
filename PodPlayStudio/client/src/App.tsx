import { Route, Switch } from 'wouter';
import { Suspense, lazy } from 'react';
import { useToast } from './hooks/use-toast';

// Lazy-loaded pages
const HomePage = lazy(() => import('./pages/home'));
const ChatPage = lazy(() => import('./pages/chat'));
const GeneratePage = lazy(() => import('./pages/generate'));
const CodePage = lazy(() => import('./pages/code'));
const LiveApiPage = lazy(() => import('./pages/live-api'));
const BuildPage = lazy(() => import('./pages/build'));
const SettingsPage = lazy(() => import('./pages/settings'));
const NotFoundPage = lazy(() => import('./pages/not-found'));

// Providers and layout
import { ThemeProvider } from './components/theme-provider';
import Layout from './components/layout';

// Hooks
import { useApiStatus } from './hooks/use-api-status';

export default function App() {
  const { toast } = useToast();
  const { status, isLoading, error } = useApiStatus();
  
  // Simple loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Loading application...</p>
      </div>
    );
  }
  
  // Show API key configuration message if needed
  if (status && !status.apiKeyConfigured) {
    toast({
      title: 'API Key Required',
      description: 'Please configure your Gemini API key in settings.',
      variant: 'destructive',
    });
  }
  
  return (
    <ThemeProvider defaultTheme="system">
      <Layout>
        <Suspense fallback={<div>Loading page...</div>}>
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/chat" component={ChatPage} />
            <Route path="/generate" component={GeneratePage} />
            <Route path="/code" component={CodePage} />
            <Route path="/live-api" component={LiveApiPage} />
            <Route path="/build" component={BuildPage} />
            <Route path="/settings" component={SettingsPage} />
            <Route component={NotFoundPage} />
          </Switch>
        </Suspense>
      </Layout>
    </ThemeProvider>
  );
}