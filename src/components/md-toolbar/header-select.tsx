import {
  Heading,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
} from "lucide-react"

import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

const HEADING_ITEMS = [
  { level: 1, icon: Heading1, label: "标题 1", cls: "text-lg font-bold" },
  { level: 2, icon: Heading2, label: "标题 2", cls: "text-base font-semibold" },
  { level: 3, icon: Heading3, label: "标题 3", cls: "text-base font-semibold" },
  { level: 4, icon: Heading4, label: "标题 4", cls: "text-base font-medium" },
  { level: 5, icon: Heading5, label: "标题 5", cls: "text-base font-medium" },
  {
    level: 6,
    icon: Heading6,
    label: "标题 6",
    cls: "text-base text-muted-foreground",
  },
]

interface Props {
  onSelectHeading: (level: number) => void
}

export const HeaderSelect = ({ onSelectHeading }: Props) => (
  <DropdownMenu>
    <DropdownMenuTrigger
      render={
        <Button variant="ghost" size="icon" className="h-8 w-8" type="button">
          <Heading className="h-4 w-4" />
        </Button>
      }
    />
    <DropdownMenuContent align="start">
      {HEADING_ITEMS.map((item) => (
        <DropdownMenuItem
          key={item.level}
          onClick={() => onSelectHeading(item.level)}
          className={item.cls}
        >
          <item.icon className="mr-2 h-4 w-4 shrink-0" />
          {item.label}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
)
