import { Link, useLocation } from 'wouter';
import { 
  MessageSquareText, 
  Code, 
  Sparkles, 
  Video, 
  FolderPlus,
  Settings,
  Moon,
  Sun,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from './theme-provider';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navItems = [
    {
      title: 'Chat',
      icon: <MessageSquareText size={20} />,
      path: '/chat'
    },
    {
      title: 'Generate',
      icon: <Sparkles size={20} />,
      path: '/generate'
    },
    {
      title: 'Code',
      icon: <Code size={20} />,
      path: '/code'
    },
    {
      title: 'Live API',
      icon: <Video size={20} />,
      path: '/live-api'
    },
    {
      title: 'Build',
      icon: <FolderPlus size={20} />,
      path: '/build'
    }
  ];
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b sticky top-0 z-10 bg-background">
        <div className="container flex h-14 items-center">
          <div className="flex items-center md:hidden">
            <button 
              onClick={toggleMobileMenu}
              className="p-2 rounded-md hover:bg-muted mr-2"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
          
          <div className="flex items-center flex-1 gap-4">
            <Link href="/">
              <a className="font-bold text-lg">PodPlay API Studio</a>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-4 ml-4">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <a
                    className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-md hover:bg-muted transition-colors ${
                      location === item.path ? 'bg-muted font-medium' : ''
                    }`}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </a>
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-muted"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <Link href="/settings">
              <a
                className={`p-2 rounded-md hover:bg-muted ${
                  location === '/settings' ? 'bg-muted' : ''
                }`}
                aria-label="Settings"
              >
                <Settings size={20} />
              </a>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-14 z-50 bg-background md:hidden">
          <nav className="container pt-4 pb-8">
            <div className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <a
                    className={`flex items-center gap-3 px-3 py-3 rounded-md hover:bg-muted transition-colors ${
                      location === item.path ? 'bg-muted font-medium' : ''
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </a>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
      
      {/* Main content */}
      <main className="flex-1 container py-8">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t py-6 bg-background">
        <div className="container flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} PodPlay API Studio
            </p>
          </div>
          <div className="flex space-x-4">
            <a
              href="https://ai.google.dev/docs/gemini_api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Gemini API Docs
            </a>
            <Link href="/settings">
              <a className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Settings
              </a>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}