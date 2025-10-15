import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface Carteira {
  id: string;
  nome: string;
  valor: number;
  icone: string;
  dataCriacao: Date;
}

interface CarteiraContextType {
  carteiras: Carteira[];
  adicionarCarteira: (carteira: Omit<Carteira, 'id' | 'dataCriacao'>) => void;
  removerCarteira: (id: string) => void;
  atualizarCarteira: (id: string, carteira: Partial<Carteira>) => void;
}

const CarteiraContext = createContext<CarteiraContextType | undefined>(undefined);

// Função para carregar carteiras do localStorage
const carregarCarteiras = (): Carteira[] => {
  try {
    const carteirasArmazenadas = localStorage.getItem('carteiras');
    console.log('Carregando carteiras do localStorage:', carteirasArmazenadas);
    if (carteirasArmazenadas) {
      const carteiras = JSON.parse(carteirasArmazenadas);
      // Converter as datas de string para Date
      const carteirasConvertidas = carteiras.map((carteira: any) => ({
        ...carteira,
        dataCriacao: new Date(carteira.dataCriacao)
      }));
      console.log('Carteiras carregadas:', carteirasConvertidas);
      return carteirasConvertidas;
    }
  } catch (error) {
    console.error('Erro ao carregar carteiras do localStorage:', error);
  }
  console.log('Nenhuma carteira encontrada, retornando array vazio');
  return [];
};

// Função para salvar carteiras no localStorage
const salvarCarteiras = (carteiras: Carteira[]) => {
  try {
    console.log('Salvando carteiras no localStorage:', carteiras);
    localStorage.setItem('carteiras', JSON.stringify(carteiras));
  } catch (error) {
    console.error('Erro ao salvar carteiras no localStorage:', error);
  }
};

export const CarteiraProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar carteiras do localStorage quando o componente é montado
  useEffect(() => {
    const carteirasCarregadas = carregarCarteiras();
    setCarteiras(carteirasCarregadas);
    setIsLoaded(true);
  }, []);

  // Salvar carteiras no localStorage sempre que a lista de carteiras mudar (mas só após carregar)
  useEffect(() => {
    if (isLoaded) {
      salvarCarteiras(carteiras);
    }
  }, [carteiras, isLoaded]);

  const adicionarCarteira = (novaCarteira: Omit<Carteira, 'id' | 'dataCriacao'>) => {
    const carteira: Carteira = {
      ...novaCarteira,
      id: Date.now().toString(),
      dataCriacao: new Date()
    };
    console.log('Adicionando nova carteira:', carteira);
    setCarteiras(prev => {
      console.log('Carteiras anteriores:', prev);
      const novasCarteiras = [...prev, carteira];
      console.log('Novas carteiras:', novasCarteiras);
      return novasCarteiras;
    });
  };

  const removerCarteira = (id: string) => {
    setCarteiras(prev => prev.filter(carteira => carteira.id !== id));
  };

  const atualizarCarteira = (id: string, carteiraAtualizada: Partial<Carteira>) => {
    setCarteiras(prev => 
      prev.map(carteira => 
        carteira.id === id ? { ...carteira, ...carteiraAtualizada } : carteira
      )
    );
  };

  return (
    <CarteiraContext.Provider value={{
      carteiras,
      adicionarCarteira,
      removerCarteira,
      atualizarCarteira
    }}>
      {children}
    </CarteiraContext.Provider>
  );
};

export const useCarteira = () => {
  const context = useContext(CarteiraContext);
  if (context === undefined) {
    throw new Error('useCarteira must be used within a CarteiraProvider');
  }
  return context;
};