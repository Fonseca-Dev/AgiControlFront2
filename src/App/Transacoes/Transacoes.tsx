import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Menubar from "../Menubar/Menubar";
import pixIcon from "../../assets/images/pix.png";

// Função auxiliar para formatar a data no padrão requerido com precisão de microssegundos
const formatarDataHoraLocal = () => {
  const agora = new Date();
  return `${agora.getFullYear()}-${
    String(agora.getMonth() + 1).padStart(2, '0')}-${
    String(agora.getDate()).padStart(2, '0')}T${
    String(agora.getHours()).padStart(2, '0')}:${
    String(agora.getMinutes()).padStart(2, '0')}:${
    String(agora.getSeconds()).padStart(2, '0')}.${
    String(agora.getMilliseconds()).padStart(3, '0')}000`;
};

const Transacoes: React.FC = () => {
  const navigate = useNavigate();
  const [saldo, setSaldo] = useState<number | null>(null);
  const [contaId, setContaId] = useState<string | null>(null);
  
  // Estados para Modal de Depósito
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositValue, setDepositValue] = useState("");
  const [isDepositLoading, setIsDepositLoading] = useState(false);
  const [depositErrorMessage, setDepositErrorMessage] = useState("");
  const [depositSuccessMessage, setDepositSuccessMessage] = useState("");
  const [isDepositBlocked, setIsDepositBlocked] = useState(false);
  
  // Estados para Modal de Saque
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawValue, setWithdrawValue] = useState("");
  const [isWithdrawLoading, setIsWithdrawLoading] = useState(false);
  const [withdrawErrorMessage, setWithdrawErrorMessage] = useState("");
  const [withdrawSuccessMessage, setWithdrawSuccessMessage] = useState("");
  const [isWithdrawBlocked, setIsWithdrawBlocked] = useState(false);

  useEffect(() => {
    const usuarioId = localStorage.getItem("userID");

    if (usuarioId) {
      fetch(`https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas` )
        .then(res => {
          if (!res.ok) throw new Error("Erro ao buscar contas");
          return res.json();
        })
        .then(data => {
          if (data && data.objeto && data.objeto.length > 0) {
            const ultimaConta = data.objeto[data.objeto.length - 1];
            setSaldo(ultimaConta.saldo);
            setContaId(ultimaConta.id);
          }
        })
        .catch(err => console.error("Erro ao buscar saldo:", err));
    }
  }, []);

  // Handlers para Depósito
  const handleDepositClick = () => {
    setShowDepositModal(true);
    setDepositValue("");
    setDepositErrorMessage("");
    setDepositSuccessMessage("");
    setIsDepositBlocked(false);
  };

  const handleCloseDepositModal = () => {
    setShowDepositModal(false);
  };

  const handleDepositSubmit = async () => {
    const usuarioId = localStorage.getItem("userID");
    
    if (!usuarioId || !contaId) {
      setDepositErrorMessage("Erro: Usuário ou conta não identificados");
      return;
    }

    // Remove pontos de milhar e substitui vírgula por ponto para conversão correta
    const valor = parseFloat(depositValue.replace(/\./g, '').replace(",", "."));
    
    if (isNaN(valor) || valor <= 0) {
      setDepositErrorMessage("Por favor, insira um valor válido maior que zero");
      return;
    }

    setIsDepositLoading(true);
    setDepositErrorMessage("");

    try {
      // Obtém a data e hora atual do dispositivo no formato requerido
      const dataAtual = formatarDataHoraLocal();

      const response = await fetch(
        `https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas/${contaId}/transacoes/depositos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            dataHoraLocal: dataAtual,
            valor: valor
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.status === "CREATED") {
        setDepositSuccessMessage(data.mensagem);
        setSaldo(prevSaldo => prevSaldo !== null ? prevSaldo + valor : valor);
        setIsDepositBlocked(true);
        
        setTimeout(() => {
          setShowDepositModal(false);
          navigate('/transacoes', { replace: true });
        }, 1000);
      } else {
        setDepositErrorMessage(data.mensagem || "Erro ao processar depósito");
      }
    } catch (error) {
      setDepositErrorMessage("Erro de conexão. Tente novamente.");
    } finally {
      setIsDepositLoading(false);
    }
  };

  const handleDepositInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove tudo que não é número
    value = value.replace(/\D/g, '');
    
    // Se estiver vazio, limpa o campo
    if (value === '') {
      setDepositValue('');
      return;
    }
    
    // Converte para número e divide por 100 para ter os centavos
    const numberValue = parseInt(value) / 100;
    
    // Formata no padrão brasileiro
    const formattedValue = numberValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    setDepositValue(formattedValue);
  };

  // Handlers para Saque
  const handleWithdrawClick = () => {
    setShowWithdrawModal(true);
    setWithdrawValue("");
    setWithdrawErrorMessage("");
    setWithdrawSuccessMessage("");
    setIsWithdrawBlocked(false);
  };

  const handleCloseWithdrawModal = () => {
    setShowWithdrawModal(false);
  };

  const handleWithdrawSubmit = async () => {
    const usuarioId = localStorage.getItem("userID");
    
    if (!usuarioId || !contaId) {
      setWithdrawErrorMessage("Erro: Usuário ou conta não identificados");
      return;
    }

    // Remove pontos de milhar e substitui vírgula por ponto para conversão correta
    const valor = parseFloat(withdrawValue.replace(/\./g, '').replace(",", "."));
    
    if (isNaN(valor) || valor <= 0) {
      setWithdrawErrorMessage("Por favor, insira um valor válido maior que zero");
      return;
    }

    if (saldo !== null && valor > saldo) {
      setWithdrawErrorMessage(`Saldo insuficiente. Valor máximo disponível: R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      return;
    }

    setIsWithdrawLoading(true);
    setWithdrawErrorMessage("");

    try {
      // Obtém a data e hora atual do dispositivo no formato requerido
      const dataAtual = formatarDataHoraLocal();

      const response = await fetch(
        `https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas/${contaId}/transacoes/saques`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            dataHoraLocal: dataAtual,
            valor: valor
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.status === "CREATED") {
        setWithdrawSuccessMessage(data.mensagem);
        setSaldo(prevSaldo => prevSaldo !== null ? prevSaldo - valor : -valor);
        setIsWithdrawBlocked(true);
        
        setTimeout(() => {
          setShowWithdrawModal(false);
          navigate('/transacoes', { replace: true });
        }, 1000);
      } else {
        setWithdrawErrorMessage(data.mensagem || "Erro ao processar saque");
      }
    } catch (error) {
      setWithdrawErrorMessage("Erro de conexão. Tente novamente.");
    } finally {
      setIsWithdrawLoading(false);
    }
  };

  const handleWithdrawInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove tudo que não é número
    value = value.replace(/\D/g, '');
    
    // Se estiver vazio, limpa o campo
    if (value === '') {
      setWithdrawValue('');
      return;
    }
    
    // Converte para número e divide por 100 para ter os centavos
    const numberValue = parseInt(value) / 100;
    
    // Formata no padrão brasileiro
    const formattedValue = numberValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    setWithdrawValue(formattedValue);
  };

  const handleMaxWithdraw = () => {
    if (saldo !== null && saldo > 0) {
      const formattedValue = saldo.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      setWithdrawValue(formattedValue);
    }
  };

  // Navegação para diferentes tipos de transação
  const handleTransferenciaPix = () => {
    navigate("/transferencia-pix");
  };

  const handlePagarBoleto = () => {
    navigate("/pagamento-boleto");
  };

  const handlePagamentoDebito = () => {
    navigate("/pagamento-debito");
  };

  const handleTransferenciaBancaria = () => {
    navigate("/transferencia");
  };

  return (
    <>
      <Menubar />

      {/* Modal de Depósito */}
      {showDepositModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#1e293b',
                margin: 0
              }}>
                Fazer Depósito
              </h2>
              <button
                onClick={handleCloseDepositModal}
                disabled={isDepositLoading || isDepositBlocked}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: isDepositLoading || isDepositBlocked ? 'not-allowed' : 'pointer',
                  color: '#64748b',
                  padding: '0',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isDepositLoading || depositSuccessMessage !== "" ? 0.5 : 1
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Valor do Depósito
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  fontSize: '16px',
                  fontWeight: '500'
                }}>
                  R$
                </span>
                <input
                  type="text"
                  value={depositValue}
                  onChange={handleDepositInputChange}
                  placeholder="0,00"
                  disabled={isDepositLoading || isDepositBlocked}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box',
                    backgroundColor: isDepositLoading || isDepositBlocked ? '#f3f4f6' : '#ffffff',
                    color: isDepositLoading || isDepositBlocked ? '#9ca3af' : '#000000',
                    cursor: isDepositLoading || isDepositBlocked ? 'not-allowed' : 'text'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0065F5';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                  }}
                />
              </div>
            </div>

            {depositErrorMessage && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                color: '#dc2626',
                fontSize: '14px'
              }}>
                {depositErrorMessage}
              </div>
            )}

            {depositSuccessMessage && (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                color: '#16a34a',
                fontSize: '14px'
              }}>
                {depositSuccessMessage}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleCloseDepositModal}
                disabled={isDepositLoading}
                style={{
                  padding: '10px 20px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: '#64748b',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isDepositLoading ? 'not-allowed' : 'pointer',
                  opacity: isDepositLoading ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                  flex: 1
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDepositSubmit}
                disabled={isDepositLoading || !depositValue.trim()}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: isDepositLoading || !depositValue.trim() ? '#94a3b8' : '#0065F5',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isDepositLoading || !depositValue.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flex: 1.5
                }}
              >
                {isDepositLoading && (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff40',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
                {isDepositLoading ? 'Processando...' : 'Confirmar Depósito'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Saque */}
      {showWithdrawModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '20px',
            width: '100%',
            maxWidth: '360px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#1e293b',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                Fazer Saque
              </h2>
              <button
                onClick={handleCloseWithdrawModal}
                disabled={isWithdrawLoading || isWithdrawBlocked}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: isWithdrawLoading || isWithdrawBlocked ? 'not-allowed' : 'pointer',
                  color: '#64748b',
                  padding: '0',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isWithdrawLoading || withdrawSuccessMessage !== "" ? 0.5 : 1
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  whiteSpace: 'nowrap'
                }}>
                  Valor do Saque
                </label>
                <button
                  onClick={handleMaxWithdraw}
                  disabled={saldo === null || saldo <= 0 || isWithdrawLoading || withdrawSuccessMessage !== ""}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0065F5',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: saldo === null || saldo <= 0 || isWithdrawLoading || withdrawSuccessMessage !== "" ? 'not-allowed' : 'pointer',
                    opacity: saldo === null || saldo <= 0 || isWithdrawLoading || withdrawSuccessMessage !== "" ? 0.5 : 1,
                    textDecoration: 'underline'
                  }}
                >
                  Valor máximo
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  fontSize: '16px',
                  fontWeight: '500'
                }}>
                  R$
                </span>
                <input
                  type="text"
                  value={withdrawValue}
                  onChange={handleWithdrawInputChange}
                  placeholder="0,00"
                  disabled={isWithdrawLoading || isWithdrawBlocked}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box',
                    backgroundColor: isWithdrawLoading || isWithdrawBlocked ? '#f3f4f6' : '#ffffff',
                    color: isWithdrawLoading || isWithdrawBlocked ? '#9ca3af' : '#000000',
                    cursor: isWithdrawLoading || isWithdrawBlocked ? 'not-allowed' : 'text'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0065F5';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                  }}
                />
              </div>
            </div>

            {withdrawErrorMessage && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                color: '#dc2626',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                {withdrawErrorMessage}
              </div>
            )}

            {withdrawSuccessMessage && (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                color: '#16a34a',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                {withdrawSuccessMessage}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              marginTop: '16px'
            }}>
              <button
                onClick={handleCloseWithdrawModal}
                disabled={isWithdrawLoading || isWithdrawBlocked}
                style={{
                  padding: '10px 20px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: '#64748b',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isWithdrawLoading || isWithdrawBlocked ? 'not-allowed' : 'pointer',
                  opacity: isWithdrawLoading || isWithdrawBlocked ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                  flex: 1
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleWithdrawSubmit}
                disabled={isWithdrawLoading || !withdrawValue.trim() || (saldo !== null && saldo <= 0)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: isWithdrawLoading || !withdrawValue.trim() || (saldo !== null && saldo <= 0) ? '#94a3b8' : '#2563eb',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isWithdrawLoading || !withdrawValue.trim() || (saldo !== null && saldo <= 0) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  flex: 1
                }}
              >
                {isWithdrawLoading && (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff40',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
                {isWithdrawLoading ? 'Processando...' : 'Confirmar Saque'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* txt "Saldo atual"*/}
      <div style={{
        position: 'fixed',
        top: '85px',
        left: '5%',
        zIndex: 1002,
        backgroundColor: 'rgba(255, 255, 255, 0.45)',
        right: '220px',
        borderRadius: '120px',
        padding: '0px 12px',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'thin'
      }}>
        Saldo atual
      </div>

      {/* Container para Saldo e Variação */}
      <div style={{
        position: 'fixed',
        top: '110px',
        left: '5%',
        zIndex: 1002,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* txt "Saldo" */}
        <div style={{
          color: 'white',
          fontSize: '36px',
          fontWeight: 'bold'
        }}>
          {saldo !== null ? (
            `R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          ) : (
            <div style={{
              width: '200px',
              height: '42px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              animation: 'pulse 1.5s ease-in-out infinite'
            }} />
          )}
        </div>
      </div>

      {/* Ícone de seta para a direita */}
      <div style={{
        position: 'fixed',
        top: '121px',
        right: '5%',
        zIndex: 1002,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <svg 
          width="32" 
          height="32" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>

      {/* Container dos Botões */}
      <div style={{
        position: 'relative',
        top: '170px',
        paddingLeft: '5%',
        paddingRight: '5%',
        zIndex: 1002,
        display: 'flex',
        gap: '12px'
      }}>
        {/* Botão Depositar */}
        <button 
          onClick={handleDepositClick}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 1)',
            color: '#0065F5',
            fontSize: '17px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
            border: 'none',
            height: '42px',
            minWidth: '150px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 101, 245, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
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
            <path d="M12 5v14"/>
            <path d="M19 12l-7-7-7 7"/>
          </svg>
          Depositar
        </button>

        {/* Botão Saque */}
        <button 
          onClick={handleWithdrawClick}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 1)',
            color: '#0065F5',
            fontSize: '17px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
            border: 'none',
            height: '42px',
            minWidth: '150px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 101, 245, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
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
            <path d="M12 5v14"/>
            <path d="M19 12l-7 7-7-7"/>
          </svg>
          Sacar
        </button>
      </div>

      {/* txt "Transações" */}
      <div style={{
        position: 'fixed',
        left: '16px',
        top: '285px',
        zIndex: 1002,
        color: 'white',
        fontSize: '18px',
        fontWeight: 'bold'
      }}>
        Transações
      </div>

      {/* Card branco fixo no bottom */}
      <div style={{
        position: 'fixed',
        left: '0px',
        right: '0px',
        top: '315px', 
        bottom: '0px', 
        height: '500px',
        borderTopRightRadius: '16px',
        borderTopLeftRadius: '16px',
        width: '100%',
        backgroundColor: 'white',
        zIndex: 1009,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>

        {/* Conteúdo do card branco - 4 botões de transação */}
        <div style={{
          flex: 1,
          padding: '30px 20px 80px',
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          overflowY: 'auto'
        }}>
          {/* Lista vertical dos botões de transação */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '300px',
            alignSelf: 'center'
          }}>
            
            {/* Transferência PIX */}
            <button 
              onClick={handleTransferenciaPix}
              style={{
                padding: '20px',
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'left',
                gap: '16px',
                width: '100%',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0065F5';
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 101, 245, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            >
              {/* Ícone à esquerda */}
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#f1f5f9',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <img 
                  src={pixIcon}
                  alt="PIX"
                  width="24" 
                  height="24" 
                  style={{
                    objectFit: 'contain'
                  }}
                />
              </div>
              
              {/* Conteúdo textual */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                flex: 1
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>
                  Transferência PIX
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#64748b'
                }}>
                  Envie dinheiro de forma instantânea
                </div>
              </div>
              
              {/* Seta à direita */}
              <div style={{
                color: '#94a3b8',
                flexShrink: 0
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
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </button>

            {/* Pagar Boleto */}
            <button 
              onClick={handlePagarBoleto}
              style={{
                padding: '20px',
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'left',
                gap: '16px',
                width: '100%',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0065F5';
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 101, 245, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            >
              {/* Ícone à esquerda */}
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#f1f5f9',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
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
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
              </div>
              
              {/* Conteúdo textual */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                flex: 1
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>
                  Pagar Boleto
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#64748b'
                }}>
                  Escaneie ou digite o código de barras
                </div>
              </div>
              
              {/* Seta à direita */}
              <div style={{
                color: '#94a3b8',
                flexShrink: 0
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
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </button>

            {/* Pagamento Débito */}
            <button 
              onClick={handlePagamentoDebito}
              style={{
                padding: '20px',
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'left',
                gap: '16px',
                width: '100%',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0065F5';
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 101, 245, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            >
              {/* Ícone à esquerda */}
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#f1f5f9',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
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
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </div>
              
              {/* Conteúdo textual */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                flex: 1
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>
                  Pagamento Débito
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#64748b'
                }}>
                  Pague usando seu cartão de débito
                </div>
              </div>
              
              {/* Seta à direita */}
              <div style={{
                color: '#94a3b8',
                flexShrink: 0
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
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </button>

            {/* Transferência Bancária */}
            <button 
              onClick={handleTransferenciaBancaria}
              style={{
                padding: '20px',
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'left',
                gap: '16px',
                width: '100%',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0065F5';
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 101, 245, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            >
              {/* Ícone à esquerda */}
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#f1f5f9',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
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
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  <polyline points="11,18 17,12 11,6"/>
                </svg>
              </div>
              
              {/* Conteúdo textual */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                flex: 1
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>
                  Transferência Bancária
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#64748b'
                }}>
                  TED para outros bancos
                </div>
              </div>
              
              {/* Seta à direita */}
              <div style={{
                color: '#94a3b8',
                flexShrink: 0
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
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </button>

          </div>
        </div>
        
      </div>

      {/* Header/card azul */}
      <div style={{
        position: 'fixed',
        top: '0px',
        bottom: '0px',
        width: '393px',
        backgroundColor: '#2563eb',
        color: 'white',
        padding: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        zIndex: 1000
      }}></div>

      {/* CSS para animações */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </>
  );
};


export default Transacoes;
