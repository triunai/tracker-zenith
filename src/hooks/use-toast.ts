
import * as React from "react"
import {
  Toast,
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"
import { useToast as useToastHook } from "@/components/ui/use-toast"

type ToasterReturn = {
  /**
   * Add a toast to the queue.
   * @param {ToastProps} toast - The toast to add.
   */
  toast: (toast: ToastProps) => void
  /**
   * Dismiss a toast by its id.
   * @param {string} toastId - The id of the toast to dismiss.
   */
  dismiss: (toastId: string) => void
  /**
   * Update a toast by its id.
   * @param {string} toastId - The id of the toast to update.
   * @param {ToastProps} toast - The toast to update.
   */
  update: (toastId: string, toast: ToastProps) => void
  /**
   * Remove a toast by its id.
   * @param {string} toastId - The id of the toast to remove.
   */
  remove: (toastId: string) => void
  /**
   * An array of toasts.
   */
  toasts: (Toast & { action?: ToastActionElement })[]
}

function useToast(): ToasterReturn {
  return useToastHook()
}

export { useToast }

// Direct toast function export to match what's being imported in use-toast.ts
export const toast = (props: ToastProps) => {
  const { toast: toastFunction } = useToastHook()
  return toastFunction(props)
}
