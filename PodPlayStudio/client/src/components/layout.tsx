import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useTheme } from './theme-provider';

// Placeholder icons (would use lucide-react)
const Icons = {
  Sun: () => <span>☀️</span>,
  Moon: () => <span>🌙</span>,
  Computer: () => <span>💻</span>,
  Chat: () => <span>💬</span>,
  Generate: () => <span>📝</span>,
  Code: () => <span>💻</span>,
  LiveAPI: () => <span>🔌</span>,
  Build: () => <span>🧰</span>,
  Settings: () => <span>⚙️</span>,
  Logo: () => <span style={{ fontSize: '1.5rem' }}>🤖</span>,
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const navItems = [
    { name: 'Chat', path: '/chat', icon: <Icons.Chat /> },
    { name: 'Generate', path: '/generate', icon: <Icons.Generate /> },
    { name: 'Code', path: '/code', icon: <Icons.Code /> },
    { name: 'Live API', path: '/live-api', icon: <Icons.LiveAPI /> },
    { name: 'Build', path: '/build', icon: <Icons.Build /> },
  ];
  
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside 
        className={`w-64 border-r bg-card transition-all ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="p-4 flex justify-between items-center border-b">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Icons.Logo />
            <span>PodPlay API Studio</span>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden"
          >
            ✕
          </button>
        </div>
        
        <nav className="p-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link 
                  href={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    location === item.path 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="mt-auto p-4 border-t">
          <Link 
            href="/settings"
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              location === '/settings' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-muted'
            }`}
          >
            <Icons.Settings />
            <span>Settings</span>
          </Link>
          
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setTheme('light')}
              className={`p-2 rounded-md ${theme === 'light' ? 'bg-muted' : ''}`}
              title="Light mode"
            >
              <Icons.Sun />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-2 rounded-md ${theme === 'dark' ? 'bg-muted' : ''}`}
              title="Dark mode"
            >
              <Icons.Moon />
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`p-2 rounded-md ${theme === 'system' ? 'bg-muted' : ''}`}
              title="System theme"
            >
              <Icons.Computer />
            </button>
          </div>
        </div>
      </aside>
      
      {/* Mobile overlay */}
      {!sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(true)}
        />
      )}
      
      {/* Main content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="border-b p-4 flex items-center">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="mr-4 md:hidden"
          >
            ☰
          </button>
          <h1 className="text-xl font-semibold">
            {navItems.find(item => item.path === location)?.name || 'Home'}
          </h1>
        </header>
        <div className="flex-1 overflow-auto p-4">
          {children}
        </div>
      </main>
    </div>
  );
}