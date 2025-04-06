import React, { useState, useEffect } from 'react';
import { 
  FolderIcon, FileIcon, MessageSquare, ChevronDown, ChevronRight, 
  PlusCircle, Code, Settings, Terminal 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate, useLocation } from 'react-router-dom';

interface TreeItem {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'chat' | 'project';
  path?: string;
  children?: TreeItem[];
}

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [treeData, setTreeData] = useState<TreeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch file structure and chats from the server
  useEffect(() => {
    const fetchData = async () => {
      try {
        // TODO: Replace with actual API calls
        const fileData = await fetch('/api/files').then(res => res.json());
        const chatData = await fetch('/api/chats').then(res => res.json());
        
        // Process and combine data
        const processedData = [
          {
            id: 'projects',
            name: 'Projects',
            type: 'project',
            children: fileData.map((file: any) => ({
              id: file.id,
              name: file.name,
              type: file.isDirectory ? 'folder' : 'file',
              path: file.path,
              children: file.children || []
            }))
          },
          {
            id: 'chats',
            name: 'Chats',
            type: 'project',
            children: chatData.map((chat: any) => ({
              id: chat.id,
              name: chat.title || 'Untitled Chat',
              type: 'chat',
              path: `/chat/${chat.id}`
            }))
          }
        ];
        
        setTreeData(processedData);
        setExpanded({ 'projects': true, 'chats': true });
      } catch (error) {
        console.error('Failed to fetch sidebar data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleItemClick = (item: TreeItem) => {
    if (item.type === 'folder' || item.type === 'project') {
      toggleExpand(item.id);
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const renderTreeItem = (item: TreeItem, depth = 0) => {
    const isExpanded = expanded[item.id];
    const isActive = item.path === location.pathname;
    const hasChildren = item.children && item.children.length > 0;
    
    const renderIcon = () => {
      switch (item.type) {
        case 'file': return <FileIcon className="h-4 w-4 text-muted-foreground" />;
        case 'folder': return <FolderIcon className="h-4 w-4 text-muted-foreground" />;
        case 'chat': return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
        case 'project': return <Code className="h-4 w-4 text-muted-foreground" />;
        default: return null;
      }
    };

    return (
      <div key={item.id}>
        <div 
          onClick={() => handleItemClick(item)}
          className={cn(
            'flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-accent/50',
            depth > 0 ? 'ml-4' : '',
            isActive ? 'bg-accent text-accent-foreground' : 'text-foreground'
          )}
        >
          <div className="mr-1">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <span className="w-4"></span>
            )}
          </div>
          {renderIcon()}
          <span className="ml-2 text-sm truncate">{item.name}</span>
        </div>
        
        {isExpanded && hasChildren && item.children?.map(child => renderTreeItem(child, depth + 1))}
      </div>
    );
  };

  const createNewChat = () => {
    // TODO: Implement API call to create a new chat
    navigate('/chat/new');
  };

  return (
    <div className="flex flex-col h-full border-r bg-background">
      <div className="p-3 border-b">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2"
          onClick={createNewChat}
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Conversation</span>
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : (
          treeData.map(item => renderTreeItem(item))
        )}
      </div>
      
      <div className="p-3 border-t">
        <div className="flex justify-around">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => navigate('/terminal')}>
                <Terminal className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Terminal</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
