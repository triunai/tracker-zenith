import * as React from "react"
import { type ToastActionElement, type ToastProps } from "@/components/ui/toast"

// Define our toast types
type ToastType = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
  open?: boolean;
};

type ToastContextType = {
  toasts: ToastType[];
  toast: (options: Omit<ToastType, "id">) => void;
  dismiss: (id: string) => void;
};

// Create the toast context with default values
const ToastContext = React.createContext<ToastContextType>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
});

// Create a provider component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastType[]>([]);

  // Add a toast
  const toast = React.useCallback((options: Omit<ToastType, "id">) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, ...options, open: true }]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  // Dismiss a toast
  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = { toasts, toast, dismiss };

  return React.createElement(ToastContext.Provider, { value }, children);
};

// Hook to use toast
export function useToast(): ToastContextType {
  const context = React.useContext(ToastContext);
  
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  
  return context;
}

// Direct toast function (as a convenience)
export const toast = {
  // Default toast
  default: (props: { title?: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode }) => {
    try {
      const { toast } = useToast();
      toast({ ...props, variant: "default" });
    } catch (e) {
      console.warn("Toast can only be used within components in the ToastProvider tree");
    }
  },
  
  // Destructive toast
  destructive: (props: { title?: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode }) => {
    try {
      const { toast } = useToast();
      toast({ ...props, variant: "destructive" });
    } catch (e) {
      console.warn("Toast can only be used within components in the ToastProvider tree");
    }
  }
};
