import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ScannerContextType {
  isOpen: boolean;
  openScanner: () => void;
  closeScanner: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const ScannerContext = createContext<ScannerContextType | undefined>(undefined);

export const ScannerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const openScanner = useCallback(() => {
    console.log('[ScannerContext] Opening scanner');
    setIsOpen(true);
  }, []);

  const closeScanner = useCallback(() => {
    console.log('[ScannerContext] Closing scanner');
    setIsOpen(false);
    setIsLoading(false);
  }, []);

  return (
    <ScannerContext.Provider
      value={{
        isOpen,
        openScanner,
        closeScanner,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </ScannerContext.Provider>
  );
};

export const useScanner = (): ScannerContextType => {
  const context = useContext(ScannerContext);
  if (!context) {
    throw new Error('useScanner must be used within a ScannerProvider');
  }
  return context;
};

