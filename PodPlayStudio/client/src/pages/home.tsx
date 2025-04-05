import { Link } from 'wouter';
import { 
  MessageSquareText, 
  Code, 
  Sparkles, 
  Video, 
  FolderPlus,
  ExternalLink
} from 'lucide-react';
import { useApiStatus } from '@/hooks/use-api-status';

export default function HomePage() {
  const { isLoading, isApiConfigured } = useApiStatus();
  
  const features = [
    {
      title: 'Chat',
      icon: <MessageSquareText size={24} className="text-primary" />,
      description: 'Have interactive conversations with Gemini AI models',
      path: '/chat'
    },
    {
      title: 'Generate',
      icon: <Sparkles size={24} className="text-primary" />,
      description: 'Generate creative content, answers, and more',
      path: '/generate'
    },
    {
      title: 'Code',
      icon: <Code size={24} className="text-primary" />,
      description: 'Get programming help and code generation',
      path: '/code'
    },
    {
      title: 'Live API',
      icon: <Video size={24} className="text-primary" />,
      description: 'Interact with Gemini using your camera and microphone',
      path: '/live-api'
    },
    {
      title: 'Build',
      icon: <FolderPlus size={24} className="text-primary" />,
      description: 'Create and manage your AI projects',
      path: '/build'
    }
  ];
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to PodPlay API Studio</h1>
        <p className="text-xl text-muted-foreground">
          Your interface for interacting with Gemini AI models
        </p>
      </div>
      
      {!isLoading && !isApiConfigured && (
        <div className="mb-8 p-4 border border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800 rounded-lg">
          <div className="flex flex-col space-y-2">
            <h2 className="text-lg font-medium">API Key Not Configured</h2>
            <p>
              To use PodPlay API Studio, you need to configure your Gemini API key. 
              Go to Settings to add your API key or set the GEMINI_API_KEY environment variable.
            </p>
            <div>
              <Link href="/settings">
                <a className="inline-flex items-center text-primary hover:underline mt-2">
                  Go to Settings
                  <ExternalLink size={16} className="ml-1" />
                </a>
              </Link>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Link key={feature.path} href={feature.path}>
            <a className="block h-full">
              <div className="border rounded-lg p-6 h-full hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  {feature.icon}
                  <h2 className="text-xl font-semibold ml-2">{feature.title}</h2>
                </div>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </a>
          </Link>
        ))}
      </div>
      
      <div className="mt-12 border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
        <ol className="list-decimal list-inside space-y-3 text-muted-foreground ml-4">
          <li>Configure your Gemini API key in the Settings page if you haven't already</li>
          <li>Try a conversation with the AI in the Chat section</li>
          <li>Generate creative content or get information in the Generate section</li>
          <li>Get help with code or programming in the Code section</li>
          <li>Try the Live API feature for real-time interaction</li>
          <li>Create a project to save your prompts and conversations</li>
        </ol>
      </div>
    </div>
  );
}