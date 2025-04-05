import { Link } from 'wouter';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="max-w-4xl mx-auto text-center py-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to PodPlay API Studio</h1>
        <p className="text-xl mb-6">
          Your comprehensive interface for the Gemini API and other AI models
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <Link href="/chat" className="block p-6 bg-card rounded-lg hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-semibold mb-2">Chat</h2>
            <p>Interactive conversations with AI models</p>
          </Link>
          
          <Link href="/generate" className="block p-6 bg-card rounded-lg hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-semibold mb-2">Generate</h2>
            <p>Create text, code, and other content</p>
          </Link>
          
          <Link href="/code" className="block p-6 bg-card rounded-lg hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-semibold mb-2">Code</h2>
            <p>Code completion and execution</p>
          </Link>
          
          <Link href="/live-api" className="block p-6 bg-card rounded-lg hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-semibold mb-2">Live API</h2>
            <p>Real-time interaction with webcam and microphone</p>
          </Link>
          
          <Link href="/build" className="block p-6 bg-card rounded-lg hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-semibold mb-2">Build</h2>
            <p>Create projects using AI assistance</p>
          </Link>
          
          <Link href="/settings" className="block p-6 bg-card rounded-lg hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-semibold mb-2">Settings</h2>
            <p>Configure your API keys and preferences</p>
          </Link>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto mt-12 px-6">
        <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
        <div className="space-y-4">
          <div className="p-4 bg-card rounded-lg">
            <h3 className="font-medium">1. Configure your API key</h3>
            <p>Visit the Settings page to set up your Gemini API key</p>
          </div>
          
          <div className="p-4 bg-card rounded-lg">
            <h3 className="font-medium">2. Start a conversation</h3>
            <p>Head to the Chat page to begin talking with an AI model</p>
          </div>
          
          <div className="p-4 bg-card rounded-lg">
            <h3 className="font-medium">3. Explore other features</h3>
            <p>Try out the Generate, Code, or Live API sections</p>
          </div>
        </div>
      </div>
    </div>
  );
}