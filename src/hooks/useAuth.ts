// src/hooks/useAuth.ts
import { useContext, createContext } from 'react';
// Importamos el tipo de dato desde el archivo principal
import type { AuthContextType } from '../contexts/AuthContext'; 

// 1. Declarar y EXPORTAR el Contexto aquí
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. Declarar y EXPORTAR el Hook aquí
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};