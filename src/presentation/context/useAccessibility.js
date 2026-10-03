import { createContext, useContext } from 'react';

export const AccessibilityContext = createContext();

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);

  if (!context) {
    throw new Error('useAccessibility debe usarse dentro de AccessibilityProvider');
  }

  return context;
};
