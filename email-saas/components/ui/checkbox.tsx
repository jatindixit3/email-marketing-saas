import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        ref={ref}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded border border-white/20 bg-white/5 backdrop-blur-xl",
          "focus:outline-none focus:ring-2 focus:ring-teal-500/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "checked:bg-teal-500 checked:border-teal-500",
          "cursor-pointer transition-all",
          className
        )}
        {...props}
      />
      <Check className="absolute h-3 w-3 text-black pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity left-0.5" />
    </div>
  )
})
Checkbox.displayName = "Checkbox"

export { Checkbox }
