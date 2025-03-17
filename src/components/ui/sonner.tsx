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
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-[#151515] dark:group-[.toaster]:border dark:group-[.toaster]:border-primary/60 dark:group-[.toaster]:shadow-[0_0_20px_rgba(94,234,212,0.3)] dark:hover:group-[.toaster]:shadow-[0_0_25px_rgba(94,234,212,0.4)] transition-all duration-200",
          description: "group-[.toast]:text-muted-foreground dark:group-[.toast]:text-primary/80",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground dark:group-[.toast]:bg-primary dark:group-[.toast]:text-[#151515] dark:group-[.toast]:shadow-neon dark:hover:group-[.toast]:shadow-neon-hover",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground dark:group-[.toast]:bg-primary/20 dark:group-[.toast]:text-primary dark:hover:group-[.toast]:bg-primary/30",
          error: "dark:group-[.toaster]:!border-destructive/60 dark:group-[.toaster]:!shadow-[0_0_20px_rgba(217,119,6,0.3)] dark:hover:group-[.toaster]:!shadow-[0_0_25px_rgba(217,119,6,0.4)] dark:group-[.toast]:!text-destructive/90",
          success: "dark:group-[.toaster]:border-primary/60 dark:group-[.toaster]:shadow-[0_0_20px_rgba(94,234,212,0.3)] dark:hover:group-[.toaster]:shadow-[0_0_25px_rgba(94,234,212,0.4)] dark:group-[.toast]:text-primary/90",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
