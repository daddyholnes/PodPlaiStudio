import { toast } from 'sonner';

type ToastOptions = {
  id?: string;
  duration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
};

export const useToast = () => {
  return {
    success: (message: string, options?: ToastOptions) => {
      toast.success(message, options);
    },
    error: (message: string, options?: ToastOptions) => {
      toast.error(message, options);
    },
    info: (message: string, options?: ToastOptions) => {
      toast.info(message, options);
    },
    warning: (message: string, options?: ToastOptions) => {
      toast.warning(message, options);
    },
    dismiss: (toastId?: string) => {
      if (toastId) {
        toast.dismiss(toastId);
      } else {
        toast.dismiss();
      }
    },
  };
};