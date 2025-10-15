import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  PlusCircle, 
  Trash2,
  Repeat,
  Send,
  FileText,
  CreditCard,
  Zap,
  Download,
  ZapOff,
  Pocket,
  Folder,
  Circle 
} from 'react-feather';

interface TipoTransacaoContextType {
  renderIcon: (iconType: string) => JSX.Element;
}

const TipoTransacaoContext = createContext<TipoTransacaoContextType | undefined>(undefined);

export const useTipoTransacao = () => {
  const context = useContext(TipoTransacaoContext);
  if (context === undefined) {
    throw new Error('useTipoTransacao deve ser usado dentro de um TipoTransacaoProvider');
  }
  return context;
};

interface TipoTransacaoProviderProps {
  children: ReactNode;
}

export const TipoTransacaoProvider: React.FC<TipoTransacaoProviderProps> = ({ children }) => {
  
  // Função para renderizar o ícone baseado no tipo
  const renderIcon = (iconType: string): JSX.Element => {
    const iconStyle = {
      width: '24px',
      height: '24px',
      color: '#000000'
    };

    switch (iconType) {
      case 'arrow-down-circle':
        return <ArrowDownCircle style={iconStyle} />;
      case 'arrow-up-circle':
        return <ArrowUpCircle style={iconStyle} />;
      case 'plus-circle':
        return <PlusCircle style={iconStyle} />;
      case 'trash-2':
        return <Trash2 style={iconStyle} />;
      case 'repeat':
        return <Repeat style={iconStyle} />;
      case 'send':
        return <Send style={iconStyle} />;
      case 'file-text':
        return <FileText style={iconStyle} />;
      case 'credit-card':
        return <CreditCard style={iconStyle} />;
      case 'zap':
        return <Zap style={iconStyle} />;
      case 'zap-off':
        return <ZapOff style={iconStyle} />;
      case 'download':
        return <Download style={iconStyle} />;
      case 'pocket':
        return <Pocket style={iconStyle} />;
      case 'folder':
        return <Folder style={iconStyle} />;
      default:
        return <Circle style={iconStyle} />;
    }
  };

  return (
    <TipoTransacaoContext.Provider value={{ renderIcon }}>
      {children}
    </TipoTransacaoContext.Provider>
  );
};