"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { IconButton } from "./IconButton";

type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem("lumen-theme", theme);
  } catch {
    /* ignore */
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("lumen-theme") as Theme | null;
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
        applyTheme(stored);
        return;
      }
    } catch {
      /* ignore */
    }
    applyTheme("dark");
  }, []);

  return (
    <IconButton
      label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="h-8 w-8"
      onClick={() => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        applyTheme(next);
      }}
    >
      {theme === "dark" ? (
        <Sun className="h-3.5 w-3.5" />
      ) : (
        <Moon className="h-3.5 w-3.5" />
      )}
    </IconButton>
  );
}
