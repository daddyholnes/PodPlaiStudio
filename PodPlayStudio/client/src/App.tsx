import { Route, Switch } from 'wouter';
import { Toaster } from 'sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { ThemeProvider } from '@/components/theme-provider';
import Layout from '@/components/layout';

// Pages
import HomePage from '@/pages/home';
import SettingsPage from '@/pages/settings';
import ChatPage from '@/pages/chat';
import CodePage from '@/pages/code';
import LiveApiPage from '@/pages/live-api';
import NotFoundPage from '@/pages/not-found';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="podplay-ui-theme">
        <Layout>
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/settings" component={SettingsPage} />
            <Route path="/chat" component={ChatPage} />
            <Route path="/code" component={CodePage} />
            <Route path="/live-api" component={LiveApiPage} />
            {/* Add these routes as they are implemented */}
            {/* <Route path="/generate" component={GeneratePage} /> */}
            {/* <Route path="/build" component={BuildPage} /> */}
            <Route component={NotFoundPage} />
          </Switch>
        </Layout>
        <Toaster position="top-right" closeButton richColors />
      </ThemeProvider>
    </QueryClientProvider>
  );
}