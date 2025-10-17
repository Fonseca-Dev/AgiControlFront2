// src/App/TransferenciaPix.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Key, DollarSign, Tag } from "lucide-react";
import Menubar from "../Menubar/Menubar";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoadingSpinner from "../../components/LoadingSpinner";

// Função auxiliar para formatar a data no padrão requerido
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

const TransferenciaPix: React.FC = () => {
  const navigate = useNavigate();
  const [saldo, setSaldo] = useState<number | null>(null);
  const [contaId, setContaId] = useState<string | null>(null);

  useEffect(() => {
    const usuarioId = localStorage.getItem("userID");

    if (usuarioId) {
      fetch(`https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas`)
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
        .catch(err => {
          console.error("Erro ao buscar saldo:", err);
          setErrorMessage("Erro ao carregar saldo. Tente novamente.");
        });
    }
  }, []);
  
  // Estados do formulário
  const [chavePix, setChavePix] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  
  // Estados de controle
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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

  const handleSubmitClick = () => {
    // Validações antes de mostrar o diálogo
    const usuarioId = localStorage.getItem("userID");
    
    if (!usuarioId || !contaId) {
      setErrorMessage("Erro: Usuário ou conta não identificados");
      return;
    }

    if (!chavePix.trim() || !valor.trim() || !categoria.trim()) {
      setErrorMessage("Todos os campos são obrigatórios.");
      return;
    }

    const valorNumerico = parseFloat(valor.replace(/\./g, "").replace(",", "."));
    
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      setErrorMessage("Por favor, insira um valor válido maior que zero");
      return;
    }

    // Verifica se o valor excede o limite de R$ 5.000,00
    if (valorNumerico > 5000) {
      setErrorMessage("O valor da transferência PIX não pode exceder R$ 5.000,00. Limite máximo permitido.");
      return;
    }

    if (saldo !== null && valorNumerico > saldo) {
      setErrorMessage(`Saldo insuficiente. Valor máximo disponível: R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      return;
    }

    // Se passou todas as validações, mostrar diálogo de confirmação
    setShowConfirmDialog(true);
  };

  const handleSubmit = async () => {
    const usuarioId = localStorage.getItem("userID");
    
    // Fechar o diálogo de confirmação
    setShowConfirmDialog(false);
    
    if (!usuarioId || !contaId) {
      setErrorMessage("Erro: Usuário ou conta não identificados");
      return;
    }

    if (!chavePix.trim() || !valor.trim() || !categoria.trim()) {
      setErrorMessage("Todos os campos são obrigatórios.");
      return;
    }

    const valorNumerico = parseFloat(valor.replace(/\./g, "").replace(",", "."));
    
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      setErrorMessage("Por favor, insira um valor válido maior que zero");
      return;
    }

    // Verifica se o valor excede o limite de R$ 5.000,00
    if (valorNumerico > 5000) {
      setErrorMessage("O valor da transferência PIX não pode exceder R$ 5.000,00. Limite máximo permitido.");
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
        `https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas/${contaId}/transacoes/transferenciasPix`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dataHoraLocal: formatarDataHoraLocal(),
            chavePixDestino: chavePix.trim(),
            valor: valorNumerico,
            categoria: categoria
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.status === "CREATED") {
        setSuccessMessage("Transferência PIX realizada com sucesso! 🎉");
        setSaldo(prevSaldo => prevSaldo !== null ? prevSaldo - valorNumerico : null);
        
        // Limpar os campos após sucesso
        setChavePix("");
        setValor("");
        setCategoria("");
        
        setTimeout(() => {
          setSuccessMessage("");
          navigate('/transacoes', { replace: true });
        }, 1000);
      } else {
        // Tratamento específico para cada tipo de erro retornado pela API
        if (response.status === 404) {
          if (data.mensagem.includes("Usuario nao encontrado")) {
            setErrorMessage("Transferência PIX negada! Usuário não encontrado.");
          } else if (data.mensagem.includes("Conta nao encontrada")) {
            setErrorMessage("Transferência PIX negada! Conta não encontrada.");
          } else if (data.mensagem.includes("Conta destino nao encontrada")) {
            setErrorMessage("Transferência PIX negada! Chave PIX não encontrada.");
          }
        } else if (response.status === 409) {
          if (data.mensagem.includes("Conta nao pertence ao usuario")) {
            setErrorMessage("Transferência PIX negada! A conta não pertence ao usuário informado.");
          } else if (data.mensagem.includes("Conta deletada")) {
            setErrorMessage("Transferência PIX negada! A conta está desativada.");
          } else if (data.mensagem.includes("Valor inválido")) {
            setErrorMessage("Transferência PIX negada! O valor informado é inválido.");
          } else if (data.mensagem.includes("Saldo insuficiente")) {
            setErrorMessage("Transferência PIX negada! Saldo insuficiente para realizar a operação.");
          }
        } else {
          setErrorMessage(data.mensagem || "Erro ao processar transferência PIX");
        }
      }
    } catch (error) {
      setErrorMessage("Erro de conexão com o servidor. Por favor, tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = chavePix.trim() && valor.trim() && categoria.trim();

  return (
    <>
      <Menubar />
      
      {/* Loading Overlay */}
      {isLoading && (
        <LoadingSpinner
          message="Processando sua transferência PIX...&#10;Aguarde um momento."
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
            borderRadius: '50%',
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
            Transferência Pix
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
                height: '32px',
                width: '180px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                animation: 'pulse 1.5s infinite',
                marginTop: '4px'
              }} />
            )}
          </div>
        </div>
      </div>

      <div style={{ position: 'fixed', left: 0, right: 0, top: '200px', bottom: 0, borderTopRightRadius: '16px', borderTopLeftRadius: '16px', backgroundColor: 'white', zIndex: 1001, overflowY: 'auto' }}>
        <div style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '24px' }}>Dados do Pix</h2>
          
          {/* Chave Pix */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              <Key size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Chave Pix do Destinatário*
            </label>
            <input 
              type="text" 
              value={chavePix} 
              onChange={(e) => setChavePix(e.target.value)} 
              placeholder={saldo === null ? "Carregando..." : isLoading ? "Processando..." : "Insira a chave PIX do destinatário..."}
              disabled={saldo === null || isLoading}
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #e2e8f0', 
                borderRadius: '8px', 
                fontSize: '16px', 
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box',
                backgroundColor: saldo === null || isLoading ? '#f3f4f6' : '#ffffff',
                color: saldo === null || isLoading ? '#9ca3af' : '#000000',
                cursor: saldo === null || isLoading ? 'not-allowed' : 'text',
                opacity: isLoading ? '0.7' : '1'
              }}
              onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; }}
            />
          </div>

          {/* Valor */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              <DollarSign size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Valor*
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '16px' }}>R$</span>
              <input 
                type="text" 
                value={valor} 
                onChange={handleValorChange}
                placeholder={saldo === null ? "Carregando..." : isLoading ? "Processando..." : "Insira o valor a transferir..."} 
                disabled={saldo === null || isLoading}
                style={{ 
                  width: '100%', 
                  padding: '12px 12px 12px 40px', 
                  border: '2px solid #e2e8f0', 
                  borderRadius: '8px', 
                  fontSize: '16px', 
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  boxSizing: 'border-box',
                  backgroundColor: saldo === null || isLoading ? '#f3f4f6' : '#ffffff',
                  color: saldo === null || isLoading ? '#9ca3af' : '#000000',
                  cursor: saldo === null || isLoading ? 'not-allowed' : 'text',
                  opacity: isLoading ? '0.7' : '1'
                }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; }}
              />
            </div>
          </div>

          {/* Categoria */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
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
                transition: 'border-color 0.2s ease',
                backgroundColor: saldo === null || isLoading ? '#f3f4f6' : '#ffffff', 
                color: saldo === null || isLoading ? '#9ca3af' : '#000000',
                boxSizing: 'border-box',
                cursor: saldo === null || isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? '0.7' : '1'
              }}
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

          {errorMessage && <div style={{ color: '#dc2626', marginBottom: '16px', textAlign: 'center' }}>{errorMessage}</div>}
          {successMessage && <div style={{ color: '#16a34a', marginBottom: '16px', textAlign: 'center' }}>{successMessage}</div>}

          <button
            onClick={handleSubmitClick}
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
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
        
        select option {
          color: #000000 !important;
          background-color: #ffffff !important;
        }
      `}</style>

      {/* Diálogo de Confirmação */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Confirmar Transferência PIX"
        message={`Você está prestes a realizar uma transferência PIX para a chave:\n\n${chavePix}`}
        amount={parseFloat(valor.replace(/\./g, "").replace(",", "."))}
        confirmText="Confirmar PIX"
        cancelText="Cancelar"
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirmDialog(false)}
        type="warning"
      />
    </>
  );
};

export default TransferenciaPix;
