import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface ThemeCtx {
  dark: boolean
  toggle: () => void
}

const ThemeContext = createContext<ThemeCtx>({ dark: false, toggle: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(() => localStorage.getItem('hn-theme') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('hn-theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
