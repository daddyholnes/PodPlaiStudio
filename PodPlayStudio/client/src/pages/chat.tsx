import { useState } from 'react';

export default function ChatPage() {
  const [message, setMessage] = useState('');
  
  // Placeholder state for chat history
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'system',
      content: 'Welcome to PodPlay API Studio Chat. How can I help you today?'
    }
  ]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // Add user message to chat
    setChatHistory([
      ...chatHistory,
      {
        role: 'user',
        content: message
      }
    ]);
    
    // Clear input
    setMessage('');
    
    // TODO: Add actual API call to Gemini
    setTimeout(() => {
      setChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `This is a placeholder response. In the actual implementation, this message would come from the Gemini API. You asked: "${message}"`
        }
      ]);
    }, 1000);
  };
  
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.map((chat, index) => (
          <div 
            key={index} 
            className={`max-w-[80%] p-3 rounded-lg ${
              chat.role === 'user' 
                ? 'ml-auto bg-primary text-primary-foreground' 
                : chat.role === 'system'
                  ? 'mx-auto bg-muted text-muted-foreground italic text-sm'
                  : 'bg-card'
            }`}
          >
            {chat.content}
          </div>
        ))}
      </div>
      
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-md bg-background"
          />
          <button 
            type="submit" 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}