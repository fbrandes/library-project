import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useMemo, type ReactNode } from "react";

import { useBookInfoStore } from "../stores/bookInfoStore";

interface AppThemeProviderProps {
  children: ReactNode;
  includeCssBaseline?: boolean;
}

export function AppThemeProvider({
  children,
  includeCssBaseline = true,
}: AppThemeProviderProps) {
  const themeMode = useBookInfoStore((state) => state.themeMode);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
          primary: {
            main: themeMode === "dark" ? "#90caf9" : "#1565c0",
          },
          secondary: {
            main: themeMode === "dark" ? "#80cbc4" : "#00796b",
          },
        },
        shape: {
          borderRadius: 8,
        },
      }),
    [themeMode],
  );

  return (
    <ThemeProvider theme={theme}>
      {includeCssBaseline ? <CssBaseline /> : null}
      {children}
    </ThemeProvider>
  );
}
