import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import Menubar from "../Menubar/Menubar";
import { useTransacao } from "../../contexts/TransacaoContext";

const DetalheTransacao: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { transacoes } = useTransacao();

  const transacao = transacoes.find(t => t.id === parseInt(id || '0'));

  if (!transacao) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: 'black',
        backgroundColor: 'white'
      }}>
        Transação não encontrada
      </div>
    );
  }

  const handleVoltar = () => {
    navigate('/extrato');
  };

  // Função local para renderizar ícone com cor azul apenas nesta tela
  const renderIconAzul = (iconType: string): JSX.Element => {
    const iconStyle = {
      width: '24px',
      height: '24px',
      color: '#0065F5'
    };

    switch (iconType) {
      case 'cafe':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 21v-1h20v1H2zM20 8h-2V5h2m0-2H4v10a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4V8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/>
          </svg>
        );
      case 'mercado':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 18a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2c0-1.11.89-2 2-2M1 2h3.27l.94 2H20a1 1 0 0 1 1 1c0 .17-.05.34-.12.5l-3.58 6.49c-.34.61-1 1.01-1.75 1.01H8.1l-.9 1.63l-.03.12A.25.25 0 0 0 7.42 15H19v2H7a2 2 0 0 1-2-2c0-.35.09-.68.24-.96l1.36-2.45L3 4H1V2m6 16a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2c0-1.11.89-2 2-2z"/>
          </svg>
        );
      case 'farmacia':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        );
      case 'cifrao':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
          </svg>
        );
      case 'pix':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
          </svg>
        );
      default:
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
          </svg>
        );
    }
  };

  return (
    <>
      <Menubar />
      
      {/* Overlay escuro de fundo */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={handleVoltar}
      >
        {/* Modal Card - Popup centralizado */}
        <div 
          style={{
            position: 'relative',
            backgroundColor: 'white',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header do Modal */}
          <div style={{
            padding: '24px 32px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {/* Título */}
            <div style={{
              color: '#000000',
              fontSize: '20px',
              fontWeight: 'bold'
            }}>
              Detalhes da Transação
            </div>
            
            {/* Botão X no canto superior direito */}
            <div 
              style={{
                position: 'absolute',
                right: '24px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                transition: 'all 0.2s ease'
              }}
              onClick={handleVoltar}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.color = '#1e293b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#64748b';
              }}
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
          </div>

          {/* Conteúdo do Modal com scroll */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '40px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '30px'
          }}>
          
          {/* Ícone grande da transação */}
          <div style={{
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ transform: 'scale(1.8)' }}>
              {renderIconAzul(transacao.icon)}
            </div>
          </div>

          {/* Valor da transação */}
          <div style={{
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#000000',
              marginBottom: '8px'
            }}>
              {transacao.tipoTransacao === 'entrada' ? '+' : '-'}R$ {transacao.valor.toLocaleString('pt-BR', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </div>
            <div style={{
              fontSize: '18px',
              color: '#8d8d8dff'
            }}>
              {transacao.tipoTransacao === 'entrada' ? 'Entrada' : 'Saída'}
            </div>
          </div>

          {/* Botão de compartilhar */}
          <div style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: '-20px'
          }}>
            <button style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}>
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16,6 12,2 8,6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
            </button>
          </div>

          {/* Detalhes da transação */}
          <div style={{
            width: '100%',
            maxWidth: '500px',
            backgroundColor: '#f8fafc',
            borderRadius: '16px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            
            {/* Tipo */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '12px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <span style={{
                fontSize: '16px',
                color: '#64748b',
                fontWeight: '500'
              }}>
                Tipo
              </span>
              <span style={{
                fontSize: '16px',
                color: '#1e293b',
                fontWeight: '600'
              }}>
                {transacao.tipo}
              </span>
            </div>

            {/* Horário */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '12px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <span style={{
                fontSize: '16px',
                color: '#64748b',
                fontWeight: '500'
              }}>
                Horário
              </span>
              <span style={{
                fontSize: '16px',
                color: '#1e293b',
                fontWeight: '600'
              }}>
                {transacao.horario}
              </span>
            </div>

            {/* Método */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '12px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <span style={{
                fontSize: '16px',
                color: '#64748b',
                fontWeight: '500'
              }}>
                Método
              </span>
              <span style={{
                fontSize: '16px',
                color: '#1e293b',
                fontWeight: '600'
              }}>
                {transacao.metodo}
              </span>
            </div>

            {/* ID da transação */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: transacao.tipoTransacao === 'entrada' && transacao.metodo === 'Pix' ? '12px' : '0px',
              borderBottom: transacao.tipoTransacao === 'entrada' && transacao.metodo === 'Pix' ? '1px solid #e2e8f0' : 'none'
            }}>
              <span style={{
                fontSize: '16px',
                color: '#64748b',
                fontWeight: '500'
              }}>
                ID
              </span>
              <span style={{
                fontSize: '16px',
                color: '#1e293b',
                fontWeight: '600'
              }}>
                #{transacao.id.toString().padStart(4, '0')}
              </span>
            </div>

            {/* Detalhes específicos por contexto */}
            
            {/* Para Pix recebido - informações do remetente */}
            {transacao.tipoTransacao === 'entrada' && transacao.metodo === 'Pix' && (
              <>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <span style={{
                    fontSize: '16px',
                    color: '#64748b',
                    fontWeight: '500'
                  }}>
                    Remetente
                  </span>
                  <span style={{
                    fontSize: '16px',
                    color: '#1e293b',
                    fontWeight: '600'
                  }}>
                    joao.silva@email.com
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <span style={{
                    fontSize: '16px',
                    color: '#64748b',
                    fontWeight: '500'
                  }}>
                    Banco
                  </span>
                  <span style={{
                    fontSize: '16px',
                    color: '#1e293b',
                    fontWeight: '600'
                  }}>
                    AgiBank
                  </span>
                </div>
              </>
            )}

            {/* Para compras no crédito - informações de parcelamento */}
            {(transacao.metodo.includes('Em ') || transacao.metodo.includes('x')) && (
              <>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <span style={{
                    fontSize: '16px',
                    color: '#64748b',
                    fontWeight: '500'
                  }}>
                    Parcelamento
                  </span>
                  <span style={{
                    fontSize: '16px',
                    color: '#1e293b',
                    fontWeight: '600'
                  }}>
                    {transacao.metodo}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <span style={{
                    fontSize: '16px',
                    color: '#64748b',
                    fontWeight: '500'
                  }}>
                    Valor da Parcela
                  </span>
                  <span style={{
                    fontSize: '16px',
                    color: '#1e293b',
                    fontWeight: '600'
                  }}>
                    R$ {(transacao.valor / parseInt(transacao.metodo.match(/\d+/)?.[0] || '1')).toLocaleString('pt-BR', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </span>
                </div>
              </>
            )}

            {/* Para débito - informações da conta */}
            {transacao.metodo === 'Débito' && (
              <>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <span style={{
                    fontSize: '16px',
                    color: '#64748b',
                    fontWeight: '500'
                  }}>
                    Conta
                  </span>
                  <span style={{
                    fontSize: '16px',
                    color: '#1e293b',
                    fontWeight: '600'
                  }}>
                    Conta Corrente
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <span style={{
                    fontSize: '16px',
                    color: '#64748b',
                    fontWeight: '500'
                  }}>
                    Final do Cartão
                  </span>
                  <span style={{
                    fontSize: '16px',
                    color: '#1e293b',
                    fontWeight: '600'
                  }}>
                    ****{Math.floor(Math.random() * 9000) + 1000}
                  </span>
                </div>
              </>
            )}

            {/* Para Pix saída - informações do destinatário */}
            {transacao.tipoTransacao === 'saida' && transacao.metodo === 'Pix' && (
              <>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <span style={{
                    fontSize: '16px',
                    color: '#64748b',
                    fontWeight: '500'
                  }}>
                    Destinatário
                  </span>
                  <span style={{
                    fontSize: '16px',
                    color: '#1e293b',
                    fontWeight: '600'
                  }}>
                    {transacao.tipo === 'Transferência' ? 'maria.santos@email.com' : 'Estabelecimento'}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <span style={{
                    fontSize: '16px',
                    color: '#64748b',
                    fontWeight: '500'
                  }}>
                    Chave Pix
                  </span>
                  <span style={{
                    fontSize: '16px',
                    color: '#1e293b',
                    fontWeight: '600'
                  }}>
                    {transacao.tipo === 'Transferência' ? 'E-mail' : 'CNPJ'}
                  </span>
                </div>
              </>
            )}

          </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default DetalheTransacao;