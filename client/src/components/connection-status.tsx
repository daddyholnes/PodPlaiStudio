import React from 'react';
import { ConnectionStatus } from '@/hooks/use-websocket';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, AlertCircle, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
  error: Error | null;
  reconnectCount: number;
  onReconnect: () => void;
  className?: string;
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  status,
  error,
  reconnectCount,
  onReconnect,
  className,
}) => {
  const getStatusDetails = () => {
    switch (status) {
      case 'connecting':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          label: 'Connecting...',
          color: 'text-yellow-500',
          message: 'Establishing connection to server',
        };
      case 'connected':
        return {
          icon: <Wifi className="h-4 w-4" />,
          label: 'Connected',
          color: 'text-green-500',
          message: 'Connection established',
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="h-4 w-4" />,
          label: 'Disconnected',
          color: 'text-red-500',
          message: error ? error.message : 'Connection lost',
        };
      case 'reconnecting':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          label: `Reconnecting (${reconnectCount})...`,
          color: 'text-amber-500',
          message: 'Attempting to reconnect to server',
        };
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          label: 'Unknown',
          color: 'text-gray-500',
          message: 'Connection status unknown',
        };
    }
  };

  const statusDetails = getStatusDetails();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-md cursor-pointer", 
              statusDetails.color,
              className
            )}
            onClick={status === 'disconnected' ? onReconnect : undefined}
          >
            {statusDetails.icon}
            <span className="text-xs font-medium">{statusDetails.label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p>{statusDetails.message}</p>
            {status === 'disconnected' && (
              <p className="text-xs mt-1">Click to reconnect</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ConnectionStatusIndicator;
