// Placeholder for the toast hook that will be implemented with shadcn/ui
// This is just a temporary implementation until we set up the shadcn components

type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
};

export const useToast = () => {
  const toast = (props: ToastProps) => {
    // For now just log to console, this will be replaced with actual toast implementation
    console.log(`[Toast - ${props.variant || 'default'}] ${props.title || ''}`, props.description || '');
  };

  return { toast };
};