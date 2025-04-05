import { Link } from 'wouter';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-16rem)] text-center px-4">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Sorry, the page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/">
        <a className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
          <Home size={16} />
          <span>Back to Home</span>
        </a>
      </Link>
    </div>
  );
}