import { Files } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DocumentToggleButtonProps {
  onClick: () => void
  isActive: boolean
}

export function DocumentToggleButton({
  onClick,
  isActive,
}: DocumentToggleButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      variant="ghost"
      className={`absolute top-4 right-4 z-10 size-10 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white/90 transition-colors ${
        isActive ? "ring-2 ring-primary ring-offset-2" : ""
      }`}
      aria-label="Toggle document list"
    >
      <Files className="size-5" />
    </Button>
  )
}
