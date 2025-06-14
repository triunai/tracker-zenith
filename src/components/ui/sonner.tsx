import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      expand={true}
      richColors={true}
      closeButton={true}
              toastOptions={{
          duration: 4000,
          style: {
            minWidth: '380px',
            padding: '20px',
            fontSize: '14px',
          },
          classNames: {
            toast:
              "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-2 group-[.toaster]:border-purple-300/50 group-[.toaster]:shadow-lg group-[.toaster]:shadow-purple-500/20 group-[.toaster]:rounded-xl group-[.toaster]:p-5 dark:group-[.toaster]:border-purple-600/50 dark:group-[.toaster]:shadow-purple-400/20",
            title: "group-[.toast]:text-sm group-[.toast]:font-semibold group-[.toast]:leading-tight group-[.toast]:text-foreground",
            description: "group-[.toast]:text-sm group-[.toast]:text-muted-foreground group-[.toast]:mt-1.5 group-[.toast]:leading-relaxed",
            actionButton:
              "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:font-medium group-[.toast]:shadow-sm group-[.toast]:hover:shadow-md group-[.toast]:transition-all",
            cancelButton:
              "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:font-medium group-[.toast]:hover:bg-muted/80 group-[.toast]:transition-all",
            closeButton:
              "group-[.toast]:bg-muted group-[.toast]:text-foreground group-[.toast]:border group-[.toast]:border-border group-[.toast]:hover:bg-muted/80 group-[.toast]:rounded-full group-[.toast]:transition-all",
          },
        }}
      {...props}
    />
  )
}

export { Toaster }
