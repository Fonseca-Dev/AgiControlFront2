import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Receipt, User, Wallet, ArrowUpDown } from 'lucide-react';

const Menubar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleHomeClick = () => {
    navigate('/home');
  };

  const handleExtratoClick = () => {
    navigate('/extrato');
  };

  const handleCarteiraClick = () => {
    navigate('/carteira');
  };

  const handleTransacoesClick = () => {
    navigate('/transacoes');
  };

  const handlePerfilClick = () => {
    navigate('/perfil');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Função auxiliar para renderizar o botão
  const renderButton = (path: string, icon: React.ReactNode, label: string, onClick: () => void) => {
    const active = isActive(path);
    const activeColor = '#2563eb';
    const inactiveColor = '#6b7280';

    return (
      <button
        onClick={onClick}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          padding: '8px 0',
          color: active ? activeColor : inactiveColor,
          transition: 'all 0.2s ease',
          flex: 1,
          minWidth: '20%'
        }}
      >
        {React.cloneElement(icon as React.ReactElement, {
          size: 24,
          fill: 'none',
          stroke: active ? activeColor : inactiveColor,
        })}
        <span style={{
          fontSize: '10px', // Reduzido para caber 5 itens
          fontWeight: active ? '600' : '400'
        }}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '0',
      left: '0',
      right: '0',
      backgroundColor: 'white',
      borderTop: '1px solid #e5e7eb',
      borderTopLeftRadius: '16px',
      borderTopRightRadius: '16px',
      padding: '8px 0',
      zIndex: 1010,
      boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        maxWidth: '393px',
        margin: '0 auto'
      }}>
        
        {/* 1. Home */}
        {renderButton('/home', <Home />, 'Home', handleHomeClick)}

        {/* 2. Extrato */}
        {renderButton('/extrato', <Receipt />, 'Extrato', handleExtratoClick)}

        {/* 3. Carteira */}
        {renderButton('/carteira', <Wallet />, 'Carteira', handleCarteiraClick)}

        {/* 4. Transações */}
        {renderButton('/transacoes', <ArrowUpDown />, 'Transações', handleTransacoesClick)}

        {/* 5. Perfil */}
        {renderButton('/perfil', <User />, 'Perfil', handlePerfilClick)}

      </div>
    </div>
  );
};

export default Menubar;
