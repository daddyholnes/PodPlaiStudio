import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
// import { Toaster } from './components/ui/toaster'; // Will be added later with shadcn components
import { queryClient } from './lib/queryClient';
import App from './App';

import './index.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(container);

root.render(
  <QueryClientProvider client={queryClient}>
    <App />
    {/* <Toaster /> */}
  </QueryClientProvider>
);