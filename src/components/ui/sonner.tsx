import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-sm group-[.toaster]:rounded-xl group-[.toaster]:hover:border-primary-opacity-40 group-[.toaster]:hover:shadow-blue-glow dark:group-[.toaster]:bg-gradient-to-br dark:group-[.toaster]:from-[#111827] dark:group-[.toaster]:to-[#151515] dark:group-[.toaster]:shadow-blue-glow dark:hover:group-[.toaster]:shadow-blue-glow",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: "dark:group-[.toaster]:!border-destructive/60 dark:group-[.toaster]:!shadow-[0_0_20px_rgba(217,119,6,0.3)] dark:hover:group-[.toaster]:!shadow-[0_0_25px_rgba(217,119,6,0.4)] dark:group-[.toast]:!text-destructive/90",
          success: "dark:group-[.toaster]:border-primary/60 dark:group-[.toaster]:shadow-[0_0_20px_rgba(94,234,212,0.3)] dark:hover:group-[.toaster]:shadow-[0_0_25px_rgba(94,234,212,0.4)] dark:group-[.toast]:text-primary/90",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
