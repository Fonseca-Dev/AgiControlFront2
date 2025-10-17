import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Building, CreditCard, DollarSign, Tag } from "lucide-react";
import Menubar from "../Menubar/Menubar";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoadingSpinner from "../../components/LoadingSpinner";

// Interface para definir a estrutura de um objeto de banco da API
interface Banco {
  ispb: string;
  name: string;
  code: number | null;
  fullName: string;
}

const Transferencia: React.FC = () => {
  const navigate = useNavigate();
  const [saldo, setSaldo] = useState<number | null>(null);
  const [contaId, setContaId] = useState<string | null>(null);
  
  // Estados para a busca de bancos
  const [todosBancos, setTodosBancos] = useState<Banco[]>([]); // Guarda todos os bancos
  const [bancosFiltrados, setBancosFiltrados] = useState<Banco[]>([]); // Guarda os bancos filtrados
  const [mostrarListaBancos, setMostrarListaBancos] = useState(false); // Controla a visibilidade da lista
  
  // Estados do formulário
  const [bancoDestino, setBancoDestino] = useState(""); // Agora é o valor do input de texto
  const [numeroContaDestino, setNumeroContaDestino] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  
  // Estados de controle
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Ref para detectar cliques fora da lista de bancos
  const bancoInputRef = useRef<HTMLDivElement>(null);

  // Efeito para buscar os dados do usuário (saldo e conta)
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

  // Efeito para buscar a lista de bancos da BrasilAPI
  useEffect(() => {
    fetch('https://brasilapi.com.br/api/banks/v1' )
      .then(res => {
        if (!res.ok) throw new Error("Erro ao buscar lista de bancos");
        return res.json();
      })
      .then((data: Banco[]) => {
        const bancosOrdenados = data.sort((a, b) => a.name.localeCompare(b.name));
        setTodosBancos(bancosOrdenados);
        setBancosFiltrados(bancosOrdenados); // Inicialmente, a lista filtrada contém todos
      })
      .catch(err => {
        console.error("Falha ao buscar bancos:", err);
        setErrorMessage("Não foi possível carregar a lista de bancos.");
      });
  }, []);

  // Efeito para fechar a lista de bancos ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bancoInputRef.current && !bancoInputRef.current.contains(event.target as Node)) {
        setMostrarListaBancos(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleBancoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const termoBusca = e.target.value;
    setBancoDestino(termoBusca);
    setMostrarListaBancos(true);

    if (termoBusca) {
      const filtrados = todosBancos.filter(banco =>
        banco.name.toLowerCase().includes(termoBusca.toLowerCase()) ||
        banco.fullName.toLowerCase().includes(termoBusca.toLowerCase())
      );
      setBancosFiltrados(filtrados);
    } else {
      setBancosFiltrados(todosBancos);
    }
  };

  const handleBancoSelect = (banco: Banco) => {
    setBancoDestino(banco.name);
    setMostrarListaBancos(false);
  };



  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove tudo que não é número
    value = value.replace(/\D/g, '');
    
    // Se estiver vazio, limpa o campo
    if (value === '') {
      setValor('');
      return;
    }
    
    // Converte para número e divide por 100 para ter os centavos
    const numberValue = parseInt(value) / 100;
    
    // Formata no padrão brasileiro
    const formattedValue = numberValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    setValor(formattedValue);
  };

  const handleNumeroContaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) setNumeroContaDestino(value);
  };

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

  const handleTransferClick = () => {
    // Validações antes de mostrar o diálogo
    const usuarioId = localStorage.getItem("userID");
    
    if (!usuarioId || !contaId) {
      setErrorMessage("Erro: Usuário ou conta não identificados");
      return;
    }

    if (!bancoDestino.trim()) {
      setErrorMessage("Por favor, selecione o banco de destino");
      return;
    }

    if (!numeroContaDestino.trim()) {
      setErrorMessage("Por favor, informe o número da conta de destino");
      return;
    }

    if (!categoria.trim()) {
      setErrorMessage("Por favor, selecione uma categoria");
      return;
    }

    const valorNumerico = parseFloat(valor.replace(/\./g, "").replace(",", "."));
    
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      setErrorMessage("Por favor, insira um valor válido maior que zero");
      return;
    }

    // Verifica se o valor excede o limite de R$ 5.000,00
    if (valorNumerico > 5000) {
      setErrorMessage("O valor da transferência bancária não pode exceder R$ 5.000,00. Limite máximo permitido.");
      return;
    }

    if (saldo !== null && valorNumerico > saldo) {
      setErrorMessage(`Saldo insuficiente. Valor máximo disponível: R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      return;
    }

    // Se passou todas as validações, mostrar diálogo de confirmação
    setShowConfirmDialog(true);
  };

  const handleTransferSubmit = async () => {
    const usuarioId = localStorage.getItem("userID");
    
    // Fechar o diálogo de confirmação
    setShowConfirmDialog(false);
    
    if (!usuarioId || !contaId) {
      setErrorMessage("Erro: Usuário ou conta não identificados");
      return;
    }

    if (!bancoDestino.trim()) {
      setErrorMessage("Por favor, selecione o banco de destino");
      return;
    }

    if (!numeroContaDestino.trim()) {
      setErrorMessage("Por favor, informe o número da conta de destino");
      return;
    }

    if (!categoria.trim()) {
      setErrorMessage("Por favor, selecione uma categoria");
      return;
    }

    const valorNumerico = parseFloat(valor.replace(/\./g, "").replace(",", "."));
    
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      setErrorMessage("Por favor, insira um valor válido maior que zero");
      return;
    }

    // Verifica se o valor excede o limite de R$ 5.000,00
    if (valorNumerico > 5000) {
      setErrorMessage("O valor da transferência bancária não pode exceder R$ 5.000,00. Limite máximo permitido.");
      return;
    }

    if (saldo !== null && valorNumerico > saldo) {
      setErrorMessage(`Saldo insuficiente. Valor máximo disponível: R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas/${contaId}/transacoes/transferencias`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataHoraLocal: formatarDataHoraLocal(),
            bancoDestino: bancoDestino,
            numeroContaDestino: parseInt(numeroContaDestino),
            valor: valorNumerico,
            categoria: categoria
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.status === "CREATED") {
        setSuccessMessage("Transferência realizada com sucesso! 🎉");
        setSaldo(prevSaldo => prevSaldo !== null ? prevSaldo - valorNumerico : -valorNumerico);
        
        setTimeout(() => {
          setBancoDestino("");
          setNumeroContaDestino("");
          setValor("");
          setCategoria("");
          navigate("/transacoes", { replace: true });
        }, 1500);
      } else {
        setErrorMessage(data.mensagem || "Erro ao processar transferência");
        setIsLoading(false);
      }
    } catch (error) {
      setErrorMessage("Erro de conexão. Tente novamente.");
      setIsLoading(false);
    }
  };

  const isFormValid = bancoDestino.trim() && numeroContaDestino.trim() && valor.trim() && categoria.trim();

  return (
    <>
      <Menubar />

      {/* Loading Overlay */}
      {isLoading && (
        <LoadingSpinner
          message="Processando sua transferência...&#10;Aguarde um momento."
          fullScreen={true}
          size="large"
        />
      )}

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
      }}>
        {/* Botão voltar */}
        <div 
          style={{
            position: 'fixed',
            top: '20px',
            left: '24px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            width: '40px',
            height: '40px',
            zIndex: 1002
          }}
          onClick={() => navigate('/transacoes')}
        >
          <svg 
            width="34" 
            height="34" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginTop: '20px',
          marginBottom: '32px'
        }}>
          <div style={{ width: '40px' }}></div> {/* Espaçador para o botão voltar */}
          <span style={{
            position: 'absolute',
            top: '80px',
            left: '24px',
            fontSize: '24px',
            fontWeight: 'bold',
            margin: 0,
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: '1.2'
          }}>
            Transferência
          </span>
        </div>

        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '14px',
          top: '45px',
          position: 'relative',
          marginBottom: '20px'
        }}>
          <div style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '4px'
          }}>
            Saldo disponível
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'white'
          }}>
            {saldo !== null ? (
              `R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            ) : (
              <div style={{
                width: '200px',
                height: '32px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
            )}
          </div>
        </div>
      </div>

      {/* Card branco com formulário */}
      <div style={{
        position: 'fixed',
        left: '0px',
        right: '0px',
        top: '200px', 
        bottom: '0px',
        borderTopRightRadius: '16px',
        borderTopLeftRadius: '16px',
        width: '100%',
        backgroundColor: 'white',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          paddingBottom: '100px'
        }}>
          
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: '24px',
            marginTop: '0'
          }}>
            Dados da Transferência
          </h2>

          {/* Campo Banco Destino com busca */}
          <div style={{ marginBottom: '20px', position: 'relative' }} ref={bancoInputRef}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              <Building size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Banco de Destino*
            </label>
            <input
              type="text"
              value={bancoDestino}
              onChange={handleBancoInputChange}
              onFocus={() => setMostrarListaBancos(true)}
              placeholder={saldo === null ? "Carregando..." : isLoading ? "Processando..." : "Insira o banco de destino..."}
              disabled={saldo === null || isLoading}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                backgroundColor: saldo === null || isLoading ? '#f3f4f6' : '#ffffff',
                color: saldo === null || isLoading ? '#9ca3af' : '#000000',
                cursor: saldo === null || isLoading ? 'not-allowed' : 'text',
                opacity: isLoading ? '0.7' : '1'
              }}
              onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; }}
            />
            {mostrarListaBancos && bancosFiltrados.length > 0 && (
              <ul style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                maxHeight: '200px',
                overflowY: 'auto',
                listStyle: 'none',
                padding: 0,
                margin: '4px 0 0 0',
                zIndex: 10,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                {bancosFiltrados.map(banco => (
                  <li
                    key={banco.ispb}
                    onClick={() => handleBancoSelect(banco)}
                    style={{
                      padding: '12px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#000000'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    {banco.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Campo Número da Conta */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              <CreditCard size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Número da Conta de Destino*
            </label>
            <input
              type="text"
              value={numeroContaDestino}
              onChange={handleNumeroContaChange}
              placeholder={saldo === null ? "Carregando..." : isLoading ? "Processando..." : "Digite o número da conta"}
              disabled={saldo === null || isLoading}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                backgroundColor: saldo === null || isLoading ? '#f3f4f6' : '#ffffff',
                color: saldo === null || isLoading ? '#9ca3af' : '#000000',
                cursor: saldo === null || isLoading ? 'not-allowed' : 'text',
                opacity: isLoading ? '0.7' : '1'
              }}
              onFocus={(e) => { e.target.style.borderColor = '#2563eb'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; }}
            />
          </div>

          {/* Campo Valor */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              <DollarSign size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Valor da Transferência*
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
                value={valor}
                onChange={handleValorChange}
                placeholder={saldo === null ? "Carregando..." : isLoading ? "Processando..." : "0,00"}
                disabled={saldo === null || isLoading}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                  backgroundColor: saldo === null || isLoading ? '#f3f4f6' : '#ffffff',
                  color: saldo === null || isLoading ? '#9ca3af' : '#000000',
                  cursor: saldo === null || isLoading ? 'not-allowed' : 'text',
                  opacity: isLoading ? '0.7' : '1'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#2563eb'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; }}
              />
            </div>
          </div>

          {/* Campo Categoria */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              <Tag size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Categoria*
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              disabled={saldo === null || isLoading}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                backgroundColor: saldo === null || isLoading ? '#f3f4f6' : '#ffffff',
                color: saldo === null || isLoading ? '#9ca3af' : '#000000',
                cursor: saldo === null || isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? '0.7' : '1',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e" )`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em'
              }}
              onFocus={(e) => { e.target.style.borderColor = '#2563eb'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; }}
            >
              <option value="">Selecione uma categoria...</option>
              <option value="Alimentação">Alimentação</option>
              <option value="Transporte">Transporte</option>
              <option value="Moradia">Moradia</option>
              <option value="Contas e Serviços">Contas e Serviços</option>
              <option value="Saúde">Saúde</option>
              <option value="Educação">Educação</option>
              <option value="Lazer">Lazer</option>
              <option value="Vestuário">Vestuário</option>
              <option value="Beleza e Cuidados Pessoais">Beleza e Cuidados Pessoais</option>
              <option value="Tecnologia">Tecnologia</option>
              <option value="Assinaturas e Streaming">Assinaturas e Streaming</option>
              <option value="Pets">Pets</option>
              <option value="Doações e Presentes">Doações e Presentes</option>
              <option value="Transferência Pessoal">Transferência Pessoal</option>
              <option value="Serviços">Serviços</option>
              <option value="Impostos e Taxas">Impostos e Taxas</option>
              <option value="Viagens">Viagens</option>
              <option value="Investimentos">Investimentos</option>
              <option value="Emergências">Emergências</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          {errorMessage && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              color: '#dc2626',
              fontSize: '14px'
            }}>
              {errorMessage}
            </div>
          )}

          {successMessage && (
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
              {successMessage}
            </div>
          )}

          <button
            onClick={handleTransferClick}
            disabled={isLoading || !isFormValid || (saldo !== null && saldo <= 0)}
            style={{
              width: '100%',
              padding: '16px',
              border: 'none',
              backgroundColor: isLoading || !isFormValid || (saldo !== null && saldo <= 0) ? '#94a3b8' : '#2563eb',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading || !isFormValid || (saldo !== null && saldo <= 0) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              margin: '0 auto'
            }}
          >
            {isLoading && (
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid #ffffff40',
                borderTop: '2px solid white',
                borderRadius: '120px',
                animation: 'spin 1s linear infinite'
              }} />
            )}
            {isLoading ? 'Processando Transferência...' : 'Confirmar Transferência'}
          </button>

        </div>
      </div>

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
        
        select option {
          color: #000000 !important;
          background-color: #ffffff !important;
        }
      `}</style>

      {/* Diálogo de Confirmação */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Confirmar Transferência TED"
        message={`Você está prestes a realizar uma transferência para:\n\nBanco: ${bancoDestino}\nConta: ${numeroContaDestino}`}
        amount={parseFloat(valor.replace(/\./g, "").replace(",", "."))}
        confirmText="Confirmar Transferência"
        cancelText="Cancelar"
        onConfirm={handleTransferSubmit}
        onCancel={() => setShowConfirmDialog(false)}
        type="warning"
      />
    </>
  );
};

export default Transferencia;
