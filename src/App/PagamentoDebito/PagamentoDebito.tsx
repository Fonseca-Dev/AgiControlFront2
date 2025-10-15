// src/App/PagamentoDebito.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building, DollarSign, Tag } from "lucide-react";
import Menubar from "../Menubar/Menubar";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useCategorySuggestions } from "../../hooks/useCategorySuggestions";

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

const PagamentoDebito: React.FC = () => {
  const navigate = useNavigate();
  
  // Hook para sugestões de categoria
  const { sugestedCategory, getSuggestionFromText, saveCategory } = useCategorySuggestions();
  
  // 2. Adicionar estados para saldo e contaId
  const [saldo, setSaldo] = useState<number | null>(null);
  const [contaId, setContaId] = useState<string | null>(null);
  
  // Estados do formulário
  const [nomeEstabelecimento, setNomeEstabelecimento] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  
  // Estados de controle
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Sugerir categoria baseada no estabelecimento
  useEffect(() => {
    if (nomeEstabelecimento.length > 3 && !categoria) {
      const sugestao = getSuggestionFromText(nomeEstabelecimento);
      if (sugestao) {
        setCategoria(sugestao);
      }
    }
  }, [nomeEstabelecimento, categoria, getSuggestionFromText]);

  // 3. Adicionar useEffect para buscar o saldo da conta
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
            setContaId(ultimaConta.id); // Guardamos o contaId para o submit
          }
        })
        .catch(err => console.error("Erro ao buscar saldo:", err));
    }
  }, []);

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
      setErrorMessage("Pagamento no débito negado! Usuario nao encontrado.");
      return;
    }

    if (!nomeEstabelecimento || nomeEstabelecimento.trim() === '') {
      setErrorMessage("Pagamento no débito negado! Nome do estabelecimento não pode estar em branco.");
      return;
    }

    if (!categoria || categoria.trim() === '') {
      setErrorMessage("Pagamento no débito negado! Categoria não pode estar em branco.");
      return;
    }

    if (!valor || valor.trim() === '') {
      setErrorMessage("Pagamento no débito negado! Valor não pode estar em branco.");
      return;
    }

    const valorNumerico = parseFloat(valor.replace(/\./g, "").replace(",", "."));

    if (isNaN(valorNumerico) || !isFinite(valorNumerico)) {
      setErrorMessage("Pagamento no débito negado! Formato do valor inválido.");
      return;
    }

    if (valorNumerico <= 0) {
      setErrorMessage("Pagamento no débito negado! Valor deve ser maior que zero.");
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
      setErrorMessage("Pagamento no débito negado! Usuario nao encontrado.");
      return;
    }

    // Validação @NotBlank do nomeEstabelecimento
    if (!nomeEstabelecimento || nomeEstabelecimento.trim() === '') {
      setErrorMessage("Pagamento no débito negado! Nome do estabelecimento não pode estar em branco.");
      return;
    }

    // Validação @NotBlank da categoria
    if (!categoria || categoria.trim() === '') {
      setErrorMessage("Pagamento no débito negado! Categoria não pode estar em branco.");
      return;
    }

    // Validação @NotNull do valor e conversão para formato correto
    if (!valor || valor.trim() === '') {
      setErrorMessage("Pagamento no débito negado! Valor não pode estar em branco.");
      return;
    }

    const valorNumerico = parseFloat(valor.replace(/\./g, "").replace(",", "."));

    // Validação do formato do valor para BigDecimal
    if (isNaN(valorNumerico) || !isFinite(valorNumerico)) {
      setErrorMessage("Pagamento no débito negado! Formato do valor inválido.");
      return;
    }

    // Validação se o valor é maior que zero
    if (valorNumerico <= 0) {
      setErrorMessage("Pagamento no débito negado! Valor inválido.");
      return;
    }

    if (saldo !== null && valorNumerico > saldo) {
      setErrorMessage("Pagamento no débito negado! Saldo insuficiente.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const pagamentoRequest = {
        dataHoraLocal: formatarDataHoraLocal(),
        nomeEstabelecimento: nomeEstabelecimento.trim(),
        valor: valorNumerico,
        categoria: categoria.trim()
      };

      const response = await fetch(
        `https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas/${contaId}/transacoes/pagamentosDebito`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(pagamentoRequest),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        switch (response.status) {
          case 404:
            setErrorMessage("Pagamento no débito negado! Usuario nao encontrado.");
            break;
          case 400:
            setErrorMessage("Pagamento no débito negado! Request esta nulo.");
            break;
          case 409:
            setErrorMessage(data.mensagem || "Pagamento no débito negado!");
            break;
          default:
            setErrorMessage("Erro ao processar o pagamento.");
        }
        return;
      }

      if (data.status === "CREATED") {
        // Salvar a categoria usada para futuras sugestões
        saveCategory(categoria.trim());
        
        setSuccessMessage("Pagamento por débito realizado com sucesso! 🎉");
        setSaldo(prev => (prev !== null ? prev - valorNumerico : null));

        // Limpar campos após sucesso
        setNomeEstabelecimento("");
        setValor("");
        setCategoria("");

        setTimeout(() => navigate("/transacoes", { replace: true }), 1500);
      } else {
        setErrorMessage(data.mensagem || "Erro ao processar o pagamento.");
      }
    } catch (error) {
      setErrorMessage("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = nomeEstabelecimento.trim() && valor.trim() && categoria.trim();

  return (
    <>
      <Menubar />
      
      {/* Loading Overlay */}
      {isLoading && (
        <LoadingSpinner
          message="Processando pagamento no débito...&#10;Aguarde um momento."
          fullScreen={true}
          size="large"
        />
      )}
      
      {/* =================================================================== */}
      {/* 4. CABEÇALHO ATUALIZADO - IDÊNTICO AO DE TRANSFERENCIA */}
      {/* =================================================================== */}
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
          onClick={() => navigate('/transacoes')} // Navega de volta para a tela de seleção
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
          <div style={{ width: '40px' }}></div> {/* Espaçador */}
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
            Pagamento no Débito
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
      
      {/* =================================================================== */}
      {/* 5. CARD BRANCO COM FORMULÁRIO - POSIÇÃO AJUSTADA */}
      {/* =================================================================== */}
      <div style={{
        position: 'fixed',
        left: '0px',
        right: '0px',
        top: '200px', // Posição ajustada para corresponder ao layout
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', paddingBottom: '100px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '24px', marginTop: '0' }}>Detalhes do Pagamento</h2>
          
          {/* Nome do Estabelecimento */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              <Building size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Nome do Estabelecimento*
            </label>
            <input 
              type="text" 
              value={nomeEstabelecimento} 
              onChange={(e) => setNomeEstabelecimento(e.target.value)} 
              placeholder={saldo === null ? "Carregando..." : isLoading ? "Processando..." : "Ex: Supermercado Central"}
              disabled={saldo === null || isLoading}
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #e2e8f0', 
                borderRadius: '8px', 
                fontSize: '16px', 
                boxSizing: 'border-box', 
                backgroundColor: saldo === null || isLoading ? '#f3f4f6' : '#ffffff',
                color: saldo === null || isLoading ? '#9ca3af' : '#000000',
                cursor: saldo === null || isLoading ? 'not-allowed' : 'text',
                opacity: isLoading ? '0.7' : '1',
                transition: 'all 0.2s ease'
              }} 
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
                placeholder={saldo === null ? "Carregando..." : isLoading ? "Processando..." : "0,00"}
                disabled={saldo === null || isLoading}
                style={{ 
                  width: '100%', 
                  padding: '12px 12px 12px 40px', 
                  border: '2px solid #e2e8f0', 
                  borderRadius: '8px', 
                  fontSize: '16px', 
                  boxSizing: 'border-box', 
                  backgroundColor: saldo === null || isLoading ? '#f3f4f6' : '#ffffff',
                  color: saldo === null || isLoading ? '#9ca3af' : '#000000',
                  cursor: saldo === null || isLoading ? 'not-allowed' : 'text',
                  opacity: isLoading ? '0.7' : '1',
                  transition: 'all 0.2s ease'
                }} 
              />
            </div>
          </div>

          {/* Campo Categoria */}
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
                backgroundColor: saldo === null || isLoading ? '#f3f4f6' : '#ffffff',
                color: saldo === null || isLoading ? '#9ca3af' : '#000000',
                cursor: saldo === null || isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? '0.7' : '1',
                transition: 'all 0.2s ease',
                appearance: 'none', 
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e" )`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}>
              
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
            {sugestedCategory && categoria === sugestedCategory && (
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #DBEAFE',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#1e40af',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ fontSize: '14px' }}>✨</span>
                Categoria sugerida automaticamente
              </div>
            )}
          </div>

          {errorMessage && <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#dc2626', fontSize: '14px' }}>{errorMessage}</div>}
          {successMessage && <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#16a34a', fontSize: '14px', textAlign: 'center' }}>{successMessage}</div>}

          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <button 
              onClick={handleSubmitClick} 
              disabled={isLoading || !isFormValid} 
              style={{ 
                width: '100%', // Reduzido para 80% da largura do container
                padding: '16px', 
                border: 'none', 
                backgroundColor: isLoading || !isFormValid ? '#94a3b8' : '#2563eb', 
                color: 'white', 
                fontSize: '16px', 
                fontWeight: '600', 
                cursor: isLoading || !isFormValid ? 'not-allowed' : 'pointer',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                margin: '0 auto'
              }}
            >
              {isLoading && 
              <div style={{ 
                width: '20px',
                height: '20px',
                border: '2px solid #ffffff40',
                borderTop: '2px solid white',
                borderRadius: '120px',
                animation: 'spin 1s linear infinite'
                }} />}
              {isLoading ? 'Processando...' : 'Confirmar Pagamento'}
            </button>
          </div>
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
      `}</style>

      {/* Diálogo de Confirmação */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Confirmar Pagamento no Débito"
        message={`Você está prestes a realizar um pagamento no débito para:\n\n${nomeEstabelecimento}`}
        amount={parseFloat(valor.replace(/\./g, "").replace(",", "."))}
        confirmText="Confirmar Pagamento"
        cancelText="Cancelar"
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirmDialog(false)}
        type="warning"
      />
    </>
  );
};

export default PagamentoDebito;
