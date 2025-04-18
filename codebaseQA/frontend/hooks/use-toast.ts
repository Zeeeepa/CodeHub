"use client"

// Adapted from shadcn/ui toast component
import { Toast, ToastActionElement, ToastProps } from "@/components/ui/toast"
import {
  useToast as useToastOriginal,
  type ToastOptions as ToastOptionsOriginal,
} from "@/components/ui/use-toast"

export interface ToastOptions extends ToastOptionsOriginal {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

export function useToast() {
  const { toast: originalToast, ...rest } = useToastOriginal()

  function toast(props: ToastOptions) {
    return originalToast(props)
  }

  return {
    toast,
    ...rest,
  }
}
