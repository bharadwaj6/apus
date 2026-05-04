import React, { createContext, useContext, useMemo } from 'react';
import type { ChartTheme } from './types';
import { lightTheme } from './themes';

const ChartThemeContext = createContext<ChartTheme | undefined>(undefined);

export interface ChartThemeProviderProps {
  theme?: ChartTheme;
  children: React.ReactNode;
}

export const ChartThemeProvider: React.FC<ChartThemeProviderProps> = ({ theme, children }) => {
  const value = useMemo(() => theme || lightTheme, [theme]);
  return <ChartThemeContext.Provider value={value}>{children}</ChartThemeContext.Provider>;
};

export const useChartTheme = (): ChartTheme => {
  const theme = useContext(ChartThemeContext);
  return theme || lightTheme;
};
