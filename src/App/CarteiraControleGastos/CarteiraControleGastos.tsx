import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Menubar from "../Menubar/Menubar";

// Interface para a carteira da API
interface CarteiraAPI {
  id: string;
  nome: string;
  saldo: number;
  estado: string;
  meta: number;
}

// Interface para a resposta da API
interface CarteiraResponse {
  mensagem: string;
  status: string;
  objeto: CarteiraAPI[];
}

const CarteiraControleGastos: React.FC = () => {
  const navigate = useNavigate();
  const [carteiras, setCarteiras] = useState<CarteiraAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URL base do backend
  const API_BASE_URL = 'https://sistema-gastos-694972193726.southamerica-east1.run.app';

  // Buscar carteiras da API
  useEffect(() => {
    const buscarCarteiras = async () => {
      const userID = localStorage.getItem('userID');
      const contaID = localStorage.getItem('contaID');

      if (!userID || !contaID) {
        setError('IDs de usuário ou conta não encontrados. Faça login novamente.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const url = `${API_BASE_URL}/usuarios/${userID}/contas/${contaID}/carteiras`;
        console.log('Buscando carteiras em:', url);

        const response = await fetch(url);
        const data: CarteiraResponse = await response.json();
        console.log('Dados recebidos:', data);

        // 1. Trata o caso de SUCESSO (OK) com carteiras
        if (data.status === 'OK' && data.objeto) {
          const carteirasAtivas = data.objeto.filter(carteira => carteira.estado === 'ATIVA');
          setCarteiras(carteirasAtivas);
          setError(null);
        
        // 2. Trata o caso de SUCESSO (OK) sem carteiras (lista vazia)
        } else if (data.status === 'OK' && !data.objeto) {
          // Backend retorna OK com objeto null quando não há carteiras
          setCarteiras([]);
          setError(null); // MUITO IMPORTANTE: Garante que o estado de erro seja limpo.

        // 3. Trata erros específicos do backend (NOT_FOUND, FORBIDDEN, CONFLICT, etc.)
        } else if (data.status === 'NOT_FOUND') {
          throw new Error(data.mensagem || 'Usuário ou conta não encontrados.');
        } else if (data.status === 'FORBIDDEN') {
          throw new Error(data.mensagem || 'Acesso negado a esta conta.');
        } else if (data.status === 'CONFLICT') {
          throw new Error(data.mensagem || 'Conta está deletada.');
        } else {
          // Trata qualquer outro erro da API
          throw new Error(data.mensagem || `Erro ${response.status}: ${response.statusText}`);
        }

      } catch (err) {
        console.error('Erro ao buscar carteiras:', err);
        
        // Seta o erro apenas para problemas reais (conexão, 500, etc.)
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        setCarteiras([]);
        
      } finally {
        setIsLoading(false);
      }
    };

    buscarCarteiras();
  }, []);

  const icones = [
    { id: "wallet", name: "Carteira", svg: <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z"/> },
    { id: "piggy-bank", name: "Cofrinho", svg: <path d="M19 7c0-1.1-.9-2-2-2h-3V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v1H3c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7zm-8 0h2v2h-2V7zm0 4h2v2h-2v-2z"/> },
    { id: "credit-card", name: "Cartão", svg: <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/> },
    { id: "home", name: "Casa", svg: <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/> },
    { id: "car", name: "Carro", svg: <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/> },
    { id: "gift", name: "Presente", svg: <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/> }
  ];

  const renderIcone = (iconeId: string = "wallet") => {
    const icone = icones.find(i => i.id === iconeId);
    if (!icone) {
      // Usar ícone padrão se não encontrar
      const iconeDefault = icones[0];
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0065F5" strokeWidth="2">
          {iconeDefault.svg}
        </svg>
      );
    }
    
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0065F5" strokeWidth="2">
        {icone.svg}
      </svg>
    );
  };

  // Função para buscar o ícone da carteira do localStorage
  const getIconeCarteira = (carteiraId: string): string => {
    const iconesCarteiras = JSON.parse(localStorage.getItem('iconesCarteiras') || '{}');
    console.log('🔍 Buscando ícone para carteira:', carteiraId);
    console.log('📦 iconesCarteiras no localStorage:', iconesCarteiras);
    const icone = iconesCarteiras[carteiraId] || 'wallet';
    console.log('🎨 Ícone encontrado:', icone);
    return icone; // 'wallet' como padrão
  };


  return (
    <>
      {/* Animação de progresso */}
      <style>{`
        @keyframes progressShine {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.85;
          }
        }
      `}</style>
      
      {/* Fundo branco da tela inteira */}
      <div style={{
        position: 'fixed',
        top: '0px',
        left: '0px',
        right: '0px',
        bottom: '0px',
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
        zIndex: 999
      }}></div>

      <Menubar />

      {/* Fundo branco do header */}
      <div style={{
        position: 'fixed',
        top: '0px',
        left: '0px',
        right: '0px',
        height: '100px',
        backgroundColor: 'white',
        zIndex: 1001
      }}></div>

      {/* Card branco scrollável com conteúdo */}
      <div style={{
        position: 'fixed',
        left: '0px',
        right: '0px',
        top: '120px', 
        bottom: '100px',
        borderTopRightRadius: '16px',
        borderTopLeftRadius: '16px',
        width: '100%',
        backgroundColor: 'white',
        zIndex: 1009,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>

        {/* Conteúdo scrollável */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 16px',
          paddingBottom: '80px',
          backgroundColor: 'white'
        }}>
          
          {/* Título Carteiras com contador */}
          <div style={{
            color: '#1e293b',
            fontSize: '20px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            Carteiras disponíveis:
            <span style={{
              backgroundColor: '#858585ff',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              padding: '2px 8px',
              minWidth: '20px',
              textAlign: 'center'
            }}>
              {isLoading ? '...' : carteiras.length}
            </span>
          </div>          

          {/* Carrossel de Carteiras */}
          <div style={{
            height: '240px',
            marginBottom: '32px'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              overflowX: 'auto',
              overflowY: 'hidden',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              cursor: 'grab',
              userSelect: 'none'
            }}
              className="carrossel-carteiras"
              onMouseDown={(e) => {
                const container = e.currentTarget;
                container.style.cursor = 'grabbing';
                let startX = e.clientX;
                let scrollLeft = container.scrollLeft;

                const handleMouseMove = (e: MouseEvent) => {
                  e.preventDefault();
                  const x = e.clientX - startX;
                  container.scrollLeft = scrollLeft - x;
                };

                const handleMouseUp = () => {
                  container.style.cursor = 'grab';
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
              onTouchStart={(e) => {
                const container = e.currentTarget;
                let startX = e.touches[0].clientX;
                let scrollLeft = container.scrollLeft;

                const handleTouchMove = (e: TouchEvent) => {
                  const x = e.touches[0].clientX - startX;
                  container.scrollLeft = scrollLeft - x;
                };

                const handleTouchEnd = () => {
                  document.removeEventListener('touchmove', handleTouchMove);
                  document.removeEventListener('touchend', handleTouchEnd);
                };

                document.addEventListener('touchmove', handleTouchMove);
                document.addEventListener('touchend', handleTouchEnd);
              }}
            >
              
              {/* Estado de carregamento */}
              {isLoading && (
                <div style={{
                  minWidth: '160px',
                  width: '160px',
                  height: '220px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <div style={{
                    color: '#64748b',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    Carregando...
                  </div>
                </div>
              )}

              {/* Estado de erro */}
              {error && !isLoading && (
                <div style={{
                  minWidth: '160px',
                  width: '160px',
                  height: '180px',
                  backgroundColor: '#fef2f2',
                  borderRadius: '16px',
                  border: '1px solid #fecaca',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  padding: '16px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    color: '#dc2626',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    Erro ao carregar carteiras
                  </div>
                </div>
              )}
              
              {/* Carteiras da API */}
              {!isLoading && !error && carteiras.map((carteira) => (
                <div key={carteira.id} style={{
                  minWidth: '160px',
                  width: '160px',
                  height: '220px',
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  padding: '20px',
                  position: 'relative',
                  flexShrink: 0
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#0065F5';
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                }}
                onClick={() => navigate(`/editar-carteira/${carteira.id}`)}
                >
                  {/* Nome da carteira */}
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#0065F5',
                    textAlign: 'center',
                    width: '100%'
                  }}>
                    {carteira.nome}
                  </div>

                  {/* Ícone da carteira */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {renderIcone(getIconeCarteira(carteira.id))}
                  </div>
                  
                  {/* Label do saldo */}
                  <div style={{
                    fontSize: '12px',
                    color: '#64748b',
                    textAlign: 'center',
                    marginBottom: '2px'
                  }}>
                    Saldo atual
                  </div>

                  {/* Valor da carteira */}
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#0065F5',
                    textAlign: 'center',
                    marginBottom: '8px'
                  }}>
                    R$ {carteira.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>

                  {/* Meta com ícone de estrela */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginBottom: '4px'
                  }}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill={carteira.saldo >= carteira.meta ? "#FFD700" : "none"}
                      stroke={carteira.saldo >= carteira.meta ? "#FFD700" : "#64748b"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span style={{
                      fontSize: '12px',
                      color: '#64748b',
                      fontWeight: '500'
                    }}>
                      Meta: R$ {carteira.meta.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Barra de progresso da meta MELHORADA */}
                  <div style={{
                    width: '100%',
                    marginTop: '4px'
                  }}>
                    {/* Porcentagem e label */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px'
                    }}>
                      <span style={{
                        fontSize: '11px',
                        color: '#64748b',
                        fontWeight: '500'
                      }}>
                        Progresso
                      </span>
                      <span style={{
                        fontSize: '11px',
                        color: carteira.saldo >= carteira.meta ? '#00CD5C' : '#0065F5',
                        fontWeight: '600'
                      }}>
                        {Math.min(Math.round((carteira.saldo / carteira.meta) * 100), 100)}%
                      </span>
                    </div>
                    
                    {/* Barra de progresso */}
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#e2e8f0',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{
                        width: `${Math.min((carteira.saldo / carteira.meta) * 100, 100)}%`,
                        height: '100%',
                        background: carteira.saldo >= carteira.meta 
                          ? 'linear-gradient(90deg, #00CD5C 0%, #00E068 100%)'
                          : 'linear-gradient(90deg, #0065F5 0%, #4D94FF 100%)',
                        transition: 'width 0.5s ease-out, background 0.3s ease',
                        borderRadius: '12px',
                        boxShadow: carteira.saldo >= carteira.meta 
                          ? '0 2px 4px rgba(0,205,92,0.3)'
                          : '0 2px 4px rgba(0,101,245,0.3)',
                        position: 'relative',
                        animation: 'progressShine 2s ease-in-out infinite'
                      }}>
                        {/* Brilho animado */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '50%',
                          background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
                          borderRadius: '12px 12px 0 0'
                        }} />
                      </div>
                    </div>
                  </div>


                </div>
              ))}

              {/* Card "Criar nova carteira" */}
              <div style={{
                minWidth: '160px',
                width: '160px',
                height: '220px',
                backgroundColor: 'white',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                flexShrink: 0
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#0065F5';
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
              onClick={() => {
                window.location.href = '/nova-carteira';
              }}
              >
                {/* Ícone + */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px'
                }}>
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="#0065F5" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14"/>
                    <path d="M5 12h14"/>
                  </svg>
                </div>
                
                {/* Texto */}
                <div style={{
                  fontSize: '14px',
                  color: '#64748b',
                  textAlign: 'center',
                  fontWeight: '500'
                }}>
                  Criar nova carteira
                </div>
              </div>

            </div>
          </div>

          {/* Card de Metas */}
          <div style={{
            height: '80px',
            width: '100%',
            backgroundColor: 'white',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '16px',
            marginBottom: '16px'
          }}>
            {/* Ícone de alvo */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFF7E6',
              borderRadius: '12px',
              padding: '12px',
              minWidth: '48px',
              height: '48px'
            }}>
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#FFB800"
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="6"/>
                <circle cx="12" cy="12" r="2"/>
              </svg>
            </div>
            
            {/* Textos e valor */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'center'
            }}>
              {/* Texto "Metas" */}
              <div style={{
                color: '#64748b',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '4px'
              }}>
                Total em Metas
              </div>
              
              {/* Valor total das metas */}
              <div style={{
                color: '#FFB800',
                fontSize: '20px',
                fontWeight: '700'
              }}>
                R$ {carteiras.reduce((total, carteira) => total + carteira.meta, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Card de Investimentos */}
          <div style={{
            height: '80px',
            width: '100%',
            backgroundColor: 'white',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '16px',
            marginBottom: '16px'
          }}>
            {/* Ícone de gráfico crescente */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f0fdf4',
              borderRadius: '12px',
              padding: '12px',
              minWidth: '48px',
              height: '48px'
            }}>
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#00CD5C" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M3 3v18h18"/>
                <path d="m19 9-5 5-4-4-3 3"/>
                <path d="M14 9h5v5"/>
              </svg>
            </div>
            
            {/* Textos e valor */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'center'
            }}>
              {/* Texto "Investimentos" */}
              <div style={{
                color: '#64748b',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '4px'
              }}>
                Total Investido
              </div>
              
              {/* Valor total dos investimentos */}
              <div style={{
                color: '#00CD5C',
                fontSize: '20px',
                fontWeight: '700'
              }}>
                R$ {carteiras.reduce((total, carteira) => total + carteira.saldo, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CarteiraControleGastos;
