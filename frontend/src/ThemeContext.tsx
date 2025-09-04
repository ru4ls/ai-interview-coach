// src/ThemeContext.tsx

import React, { createContext, useState, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { red } from '@mui/material/colors';

interface ThemeContextType {
  toggleTheme: () => void;
  mode: 'light' | 'dark';
}

export const ThemeContext = createContext<ThemeContextType>({
  toggleTheme: () => {},
  mode: 'dark',
});

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: {
        main: '#3B82F6',
      },
      secondary: {
        main: '#10B981',
      },
      background: {
        default: mode === 'light' ? '#F9FAFB' : '#0D1117',
        paper: mode === 'light' ? '#FFFFFF' : '#161B22',
      },
      text: {
        primary: mode === 'light' ? '#111827' : '#E5E7EB',
        secondary: mode === 'light' ? '#6B7280' : '#9CA3AF',
      },
      divider: mode === 'light' ? '#E5E7EB' : '#30363D',
      error: {
        main: red.A400,
      },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h5: { fontWeight: 600 },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: { textTransform: 'none', fontWeight: 600 },
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    border: '1px solid',
                    borderColor: mode === 'dark' ? '#30363D' : '#E5E7EB',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                    backgroundColor: mode === 'dark' 
                        ? 'rgba(22, 27, 34, 0.9)'
                        : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(4px)',
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    border: '1px solid',
                    borderColor: mode === 'dark' ? '#30363D' : '#E5E7EB',
                    boxShadow: 'none',
                    backgroundColor: 'transparent',
                }
            }
        },
        MuiFilledInput: {
            styleOverrides: {
                root: {
                    // border: '1px solid', borderColor: '#30363D',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    backgroundColor: mode === 'light' ? '#F3F4F6' : '#0D1117',
                    boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)', 
                    '&:hover': {
                        backgroundColor: mode === 'light' ? '#E5E7EB' : 'rgba(255, 255, 255, 0.04)',
                        //borderColor: '#3B82F6',
                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.4)',
                    },
                    '&.Mui-focused': {
                        backgroundColor: mode === 'light' ? '#E5E7EB' : 'rgba(255, 255, 255, 0.04)',
                        //borderColor: '#60A5FA',
                        boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.5)',
                    },
                },
                underline: { '&:before, &:hover:before, &:after': { border: 'none' } }
            }
        },
        MuiSelect: {
            styleOverrides: {
                filled: { backgroundColor: 'transparent' }
            }
        },
        MuiAppBar: { 
            styleOverrides: {
                root: {
                    position: 'sticky',
                    border: 'none',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                    backgroundColor: mode === 'dark' 
                        ? 'rgba(22, 27, 34, 0.75)'
                        : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    color: mode  === 'dark' ? 'white' : 'black',
                }
            }
        },
    },
  }), [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ toggleTheme, mode }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};