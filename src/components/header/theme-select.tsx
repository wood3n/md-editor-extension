import { Palette } from "lucide-react"

import { ThemeList } from "@/constants"
import { useTheme } from "@/hooks/use-theme"
import { cn } from "@/lib/utils"

import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu"

export const ThemeSelect = () => {
  const themeContext = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon" type="button">
            <Palette className="h-4 w-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-max">
        {ThemeList.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => themeContext?.setTheme(t.id)}
            className={cn(
              "whitespace-nowrap",
              themeContext?.theme === t.id && "bg-accent text-accent-foreground",
            )}
          >
            {t.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
