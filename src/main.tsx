import { createRoot } from "react-dom/client"

import { TooltipProvider } from "@/components/ui/tooltip"

import App from "./app"
import { ThemeProvider } from "./context/theme"

import "./index.css"

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </ThemeProvider>,
)
