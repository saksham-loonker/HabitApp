import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:scale-105",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md shadow-primary/20",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md shadow-red-500/20",
        outline: "border-border/50 bg-background hover:bg-accent hover:text-accent-foreground",
        success:
          "border-transparent bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md shadow-green-500/20",
        warning:
          "border-transparent bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
