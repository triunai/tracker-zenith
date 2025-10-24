import { toast } from 'sonner';
import { CheckCircle, AlertCircle, Info, AlertTriangle, Sparkles, Brain, FileText, DollarSign, Calendar, Building2, Trash2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'ai' | 'document' | 'transaction' | 'remove';

interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const getToastIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return CheckCircle;
    case 'error':
      return AlertCircle;
    case 'warning':
      return AlertTriangle;
    case 'info':
      return Info;
    case 'ai':
      return Brain;
    case 'document':
      return FileText;
    case 'transaction':
      return DollarSign;
    case 'remove':
      return Trash2;
    default:
      return Info;
  }
};

const getToastColors = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'text-green-700 dark:text-green-300';
    case 'error':
      return 'text-red-700 dark:text-red-300';
    case 'warning':
      return 'text-orange-700 dark:text-orange-300';
    case 'info':
      return 'text-blue-700 dark:text-blue-300';
    case 'ai':
      return 'text-purple-700 dark:text-purple-300';
    case 'document':
      return 'text-indigo-700 dark:text-indigo-300';
    case 'transaction':
      return 'text-emerald-700 dark:text-emerald-300';
    case 'remove':
      return 'text-gray-700 dark:text-gray-300';
    default:
      return 'text-gray-700 dark:text-gray-300';
  }
};

export const showToast = (type: ToastType, options: ToastOptions) => {
  const Icon = getToastIcon(type);
  const iconColors = getToastColors(type);

  const toastOptions: {
    duration: number;
    action?: {
      label: string;
      onClick: () => void;
    };
  } = {
    duration: options.duration || 4000,
  };

  if (options.action) {
    toastOptions.action = {
      label: options.action.label,
      onClick: options.action.onClick,
    };
  }

  // Create beautiful toast content with icon
  const toastContent = (
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-full bg-gradient-to-br ${getIconBackground(type)} backdrop-blur-sm`}>
        <Icon className={`h-4 w-4 ${iconColors}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-foreground text-sm">{options.title}</div>
        {options.description && (
          <div className="text-sm text-muted-foreground mt-1 leading-relaxed">{options.description}</div>
        )}
      </div>
    </div>
  );

  switch (type) {
    case 'success':
      return toast.success(toastContent, toastOptions);
    case 'error':
      return toast.error(toastContent, toastOptions);
    case 'warning':
      return toast.warning(toastContent, toastOptions);
    case 'info':
      return toast.info(toastContent, toastOptions);
    default:
      return toast(toastContent, toastOptions);
  }
};

const getIconBackground = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50';
    case 'error':
      return 'from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50';
    case 'warning':
      return 'from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-800/50';
    case 'info':
      return 'from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50';
    case 'ai':
      return 'from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50';
    case 'document':
      return 'from-indigo-100 to-indigo-200 dark:from-indigo-900/50 dark:to-indigo-800/50';
    case 'transaction':
      return 'from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50';
    case 'remove':
      return 'from-gray-100 to-gray-200 dark:from-gray-800/50 dark:to-gray-700/50';
    default:
      return 'from-gray-100 to-gray-200 dark:from-gray-800/50 dark:to-gray-700/50';
  }
};

// Predefined toast functions for common use cases
export const toastNotifications = {
  // Document processing toasts
  documentReady: (vendorName: string, amount: string, confidence: number) => 
    showToast('ai', {
      title: '✨ Document Ready!',
      description: `${vendorName} • ${amount} • ${confidence}% AI confidence`,
      duration: 5000,
    }),

  documentUploaded: (filename: string) =>
    showToast('document', {
      title: '📄 Document Uploaded',
      description: `${filename.length > 25 ? filename.substring(0, 25) + '...' : filename} is being processed...`,
      duration: 4000,
    }),

  documentProcessing: (filename: string) =>
    showToast('info', {
      title: '🧠 AI Processing',
      description: `Analyzing ${filename.length > 20 ? filename.substring(0, 20) + '...' : filename}...`,
      duration: 3000,
    }),

  documentError: (error: string) =>
    showToast('error', {
      title: '❌ Processing Failed',
      description: error.length > 60 ? error.substring(0, 60) + '...' : error,
      duration: 6000,
    }),

  // Transaction toasts
  transactionCreated: (vendorName: string, amount: string) =>
    showToast('transaction', {
      title: '💰 Transaction Created!',
      description: `${vendorName} • ${amount} added successfully`,
      duration: 4000,
    }),

  transactionError: (error: string) =>
    showToast('error', {
      title: '❌ Transaction Failed',
      description: error.length > 50 ? error.substring(0, 50) + '...' : error,
      duration: 5000,
    }),

  // Generic toasts
  success: (title: string, description?: string) =>
    showToast('success', { 
      title, 
      description: description && description.length > 60 ? description.substring(0, 60) + '...' : description 
    }),

  error: (title: string, description?: string) =>
    showToast('error', { 
      title, 
      description: description && description.length > 60 ? description.substring(0, 60) + '...' : description 
    }),

  warning: (title: string, description?: string) =>
    showToast('warning', { 
      title, 
      description: description && description.length > 60 ? description.substring(0, 60) + '...' : description 
    }),

  info: (title: string, description?: string) =>
    showToast('info', { 
      title, 
      description: description && description.length > 60 ? description.substring(0, 60) + '...' : description 
    }),

  // Document removal
  documentRemoved: () =>
    showToast('remove', {
      title: 'Document Removed',
      description: 'Document removed from list',
      duration: 3000,
    }),
}; 