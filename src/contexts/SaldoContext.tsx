import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface SaldoContextType {
  saldo: number;
  setSaldo: (value: number) => void;
}

const SaldoContext = createContext<SaldoContextType | undefined>(undefined);

export const useSaldo = () => {
  const context = useContext(SaldoContext);
  if (context === undefined) {
    throw new Error('useSaldo deve ser usado dentro de um SaldoProvider');
  }
  return context;
};

interface SaldoProviderProps {
  children: ReactNode;
}

export const SaldoProvider: React.FC<SaldoProviderProps> = ({ children }) => {
  const [saldo, setSaldo] = useState<number>(1000); // Valor inicial do saldo

  return (
    <SaldoContext.Provider value={{ saldo, setSaldo }}>
      {children}
    </SaldoContext.Provider>
  );
};