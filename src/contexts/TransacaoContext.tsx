import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface Transacao {
  id: number;
  transacaoId?: string; // ID real da transação para buscar detalhes
  tipo: string;
  icon: string;
  horario: string;
  data?: string;
  valor: number;
  metodo: string;
  tipoTransacao: 'entrada' | 'saida';
}

interface TransacaoContextType {
  transacoes: Transacao[];
  setTransacoes: (value: Transacao[]) => void;
  adicionarTransacao: (transacao: Omit<Transacao, 'id'>) => void;
  removerTransacao: (id: number) => void;
}

const TransacaoContext = createContext<TransacaoContextType | undefined>(undefined);

export const useTransacao = () => {
  const context = useContext(TransacaoContext);
  if (context === undefined) {
    throw new Error('useTransacao deve ser usado dentro de um TransacaoProvider');
  }
  return context;
};

interface TransacaoProviderProps {
  children: ReactNode;
}

export const TransacaoProvider: React.FC<TransacaoProviderProps> = ({ children }) => {
  // Dados de exemplo das transações
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);

  const adicionarTransacao = (novaTransacao: Omit<Transacao, 'id'>) => {
    const id = Math.max(...transacoes.map(t => t.id), 0) + 1;
    setTransacoes(prev => [...prev, { ...novaTransacao, id }]);
  };

  const removerTransacao = (id: number) => {
    setTransacoes(prev => prev.filter(t => t.id !== id));
  };

  return (
    <TransacaoContext.Provider value={{ 
      transacoes, 
      setTransacoes, 
      adicionarTransacao, 
      removerTransacao 
    }}>
      {children}
    </TransacaoContext.Provider>
  );
};