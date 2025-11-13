'use client';

import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { customTheme } from '@/theme';
import { ReactNode } from 'react';

/**
 * Component: ThemeProvider
 * MUI 테마 프로바이더 래퍼
 * @param {ReactNode} children - 자식 컴포넌트 [Required]
 * @example <ThemeProvider>{children}</ThemeProvider>
 */
interface Props {
  children: ReactNode;
}

export default function ThemeProvider({ children }: Props) {
  return (
    <MuiThemeProvider theme={customTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

