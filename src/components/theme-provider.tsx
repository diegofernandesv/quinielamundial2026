"use client"

import * as React from "react"

type Theme = "light" | "dark" | "system"
type ResolvedTheme = Exclude<Theme, "system">

type ThemeProviderProps = {
  attribute?: "class"
  children: React.ReactNode
  defaultTheme?: Theme
  disableTransitionOnChange?: boolean
  enableSystem?: boolean
}

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)
const STORAGE_KEY = "theme"

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(theme: Theme, enableSystem: boolean, disableTransitionOnChange: boolean) {
  if (typeof document === "undefined") return

  const resolvedTheme =
    theme === "system" && enableSystem ? getSystemTheme() : (theme as ResolvedTheme)

  let cleanup: (() => void) | undefined

  if (disableTransitionOnChange) {
    const style = document.createElement("style")
    style.textContent =
      "*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}"
    document.head.appendChild(style)
    cleanup = () => {
      window.getComputedStyle(document.body)
      window.setTimeout(() => {
        document.head.removeChild(style)
      }, 1)
    }
  }

  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(resolvedTheme)
  root.style.colorScheme = resolvedTheme

  cleanup?.()
}

function ThemeProvider({
  children,
  defaultTheme = "system",
  disableTransitionOnChange = false,
  enableSystem = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>("light")

  React.useEffect(() => {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY) as Theme | null
    const nextTheme = storedTheme ?? defaultTheme
    setThemeState(nextTheme)
    setResolvedTheme(
      nextTheme === "system" && enableSystem ? getSystemTheme() : (nextTheme as ResolvedTheme)
    )
  }, [defaultTheme, enableSystem])

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")

    const updateTheme = () => {
      const nextResolvedTheme =
        theme === "system" && enableSystem ? getSystemTheme() : (theme as ResolvedTheme)
      setResolvedTheme(nextResolvedTheme)
      applyTheme(theme, enableSystem, disableTransitionOnChange)
    }

    updateTheme()
    media.addEventListener("change", updateTheme)
    return () => media.removeEventListener("change", updateTheme)
  }, [theme, enableSystem, disableTransitionOnChange])

  const setTheme = React.useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme)
    window.localStorage.setItem(STORAGE_KEY, nextTheme)
  }, [])

  const value = React.useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used within <ThemeProvider>")
  return context
}

export { ThemeProvider, useTheme }
