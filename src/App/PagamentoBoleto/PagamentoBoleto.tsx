// src/App/PagamentoBoleto.tsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Barcode, Calendar, User, Building, DollarSign, Tag } from "lucide-react";
import Menubar from "../Menubar/Menubar";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useCategorySuggestions } from "../../hooks/useCategorySuggestions";

// Interface para definir a estrutura de um objeto de banco da API
interface Banco {
  ispb: string;
  name: string;
  code: number | null;
  fullName: string;
}

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

const PagamentoBoleto: React.FC = () => {
  const navigate = useNavigate();
  const [saldo, setSaldo] = useState<number | null>(null);
  const [contaId, setContaId] = useState<string | null>(null);
  
  // Hook para sugestões de categoria
  const { sugestedCategory, getSuggestionFromText, saveCategory } = useCategorySuggestions();
  
  // Estados para a busca de bancos
  const [todosBancos, setTodosBancos] = useState<Banco[]>([]);
  const [bancosFiltrados, setBancosFiltrados] = useState<Banco[]>([]);
  const [mostrarListaBancos, setMostrarListaBancos] = useState(false);
  
  // Estados do formulário
  const [codigoBarras, setCodigoBarras] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [nomeBeneficiario, setNomeBeneficiario] = useState("");
  const [instituicaoFinanceira, setInstituicaoFinanceira] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  
  // Estados de controle
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Ref para detectar cliques fora da lista de bancos
  const bancoInputRef = useRef<HTMLDivElement>(null);

  // Sugerir categoria baseada no beneficiário
  useEffect(() => {
    if (nomeBeneficiario.length > 3 && !categoria) {
      const sugestao = getSuggestionFromText(nomeBeneficiario);
      if (sugestao) {
        setCategoria(sugestao);
      }
    }
  }, [nomeBeneficiario, categoria, getSuggestionFromText]);

  // Efeito para buscar os dados do usuário (saldo e conta)
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
        .catch(err => console.error("Erro ao buscar saldo:", err));
    }
  }, []);

  // Efeito para buscar a lista de bancos da BrasilAPI
  useEffect(() => {
    fetch('https://brasilapi.com.br/api/banks/v1')
      .then(res => {
        if (!res.ok) throw new Error("Erro ao buscar lista de bancos");
        return res.json();
      })
      .then((data: Banco[]) => {
        const bancosOrdenados = data.sort((a, b) => a.name.localeCompare(b.name));
        setTodosBancos(bancosOrdenados);
        setBancosFiltrados(bancosOrdenados);
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
    setInstituicaoFinanceira(termoBusca);
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
    setInstituicaoFinanceira(banco.name);
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

  const handleSubmitClick = () => {
    // Validações antes de mostrar o diálogo
    const usuarioId = localStorage.getItem("userID");
    
    if (!usuarioId || !contaId) {
      setErrorMessage("Erro: Usuário ou conta não identificados");
      return;
    }

    if (!codigoBarras.trim() || !dataVencimento.trim() || !nomeBeneficiario.trim() || !instituicaoFinanceira.trim() || !valor.trim() || !categoria.trim()) {
      setErrorMessage("Todos os campos são obrigatórios.");
      return;
    }

    const valorNumerico = parseFloat(valor.replace(/\./g, "").replace(",", "."));
    
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      setErrorMessage("Por favor, insira um valor válido maior que zero");
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

    if (!codigoBarras.trim() || !dataVencimento.trim() || !nomeBeneficiario.trim() || !instituicaoFinanceira.trim() || !valor.trim() || !categoria.trim()) {
      setErrorMessage("Todos os campos são obrigatórios.");
      return;
    }

    const valorNumerico = parseFloat(valor.replace(/\./g, "").replace(",", "."));
    
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      setErrorMessage("Por favor, insira um valor válido maior que zero");
      return;
    }

    if (saldo !== null && valorNumerico > saldo) {
      setErrorMessage(`Saldo insuficiente. Valor máximo disponível: R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    // ===================================================================
    // CORREÇÃO DEFINITIVA: Formatar a data para o padrão LocalDateTime
    // ===================================================================
    // Pega a data do input (ex: "2025-10-08")
    // Pega a hora atual e formata para HH:mm:ss
    const agora = new Date();
    const horas = agora.getHours().toString().padStart(2, '0');
    const minutos = agora.getMinutes().toString().padStart(2, '0');
    const segundos = agora.getSeconds().toString().padStart(2, '0');
    
    // Junta tudo no formato ISO 8601 que o backend espera
    const dataVencimentoISO = `${dataVencimento}T${horas}:${minutos}:${segundos}`;

    try {
      const response = await fetch(
        `https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas/${contaId}/transacoes/pagamentosBoleto`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dataHoraLocal: formatarDataHoraLocal(),
            codigoBarras: codigoBarras.trim(),
            dataVencimento: dataVencimentoISO,
            nomeBeneficiario: nomeBeneficiario.trim(),
            instituicaoFinanceira: instituicaoFinanceira.trim(),
            valor: valorNumerico,
            categoria: categoria.trim()
          } )
        }
      );

      const data = await response.json();

      if (response.ok && data.status === "CREATED") {
        // Salvar a categoria usada para futuras sugestões
        saveCategory(categoria.trim());
        
        setSuccessMessage("Pagamento de boleto realizado com sucesso! 🎉");
        setSaldo(prevSaldo => prevSaldo !== null ? prevSaldo - valorNumerico : -valorNumerico);
        
        // Limpar os campos após sucesso
        setCodigoBarras("");
        setDataVencimento("");
        setNomeBeneficiario("");
        setInstituicaoFinanceira("");
        setValor("");
        setCategoria("");

        setTimeout(() => {
          navigate("/transacoes", { replace: true });
        }, 1500);
      } else {
        setErrorMessage(data.mensagem || "Erro ao processar o pagamento do boleto.");
      }
    } catch (error) {
      setErrorMessage("Erro de conexão. Tente novamente mais tarde.");
      console.error("Erro na chamada da API de pagamento de boleto:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = codigoBarras.trim() && dataVencimento.trim() && nomeBeneficiario.trim() && instituicaoFinanceira.trim() && valor.trim() && categoria.trim();

  return (
    <>
      <Menubar />

      {/* Loading Overlay */}
      {isLoading && (
        <LoadingSpinner
          message="Processando pagamento do boleto...&#10;Aguarde um momento."
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
            Pagamento de Boleto
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
            Dados do Boleto
          </h2>

          {/* Campo Código de Barras */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              <Barcode size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Código de Barras*
            </label>
            <input
              type="text"
              value={codigoBarras}
              onChange={(e) => setCodigoBarras(e.target.value)}
              placeholder="Digite ou cole o código de barras"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box',
                backgroundColor: '#ffffff',
                color: '#000000'
              }}
              onFocus={(e) => { e.target.style.borderColor = '#2563eb'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; }}
            />
          </div>

          {/* Campo Data de Vencimento */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              <Calendar size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Data de Vencimento*
            </label>
            <input
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box',
                backgroundColor: '#ffffff',
                color: '#000000'
              }}
              onFocus={(e) => { e.target.style.borderColor = '#2563eb'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; }}
            />
          </div>

          {/* Campo Nome do Beneficiário */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              <User size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Nome do Beneficiário*
            </label>
            <input
              type="text"
              value={nomeBeneficiario}
              onChange={(e) => setNomeBeneficiario(e.target.value)}
              placeholder="Ex: Empresa de Energia S/A"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box',
                backgroundColor: '#ffffff',
                color: '#000000'
              }}
              onFocus={(e) => { e.target.style.borderColor = '#2563eb'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; }}
            />
          </div>

          {/* Campo Instituição Financeira com busca */}
          <div style={{ marginBottom: '20px', position: 'relative' }} ref={bancoInputRef}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              <Building size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Instituição Financeira*
            </label>
            <input
              type="text"
              value={instituicaoFinanceira}
              onChange={handleBancoInputChange}
              placeholder="Digite o nome do banco..."
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box',
                backgroundColor: '#ffffff',
                color: '#000000'
              }}
              onFocus={(e) => { 
                e.target.style.borderColor = '#2563eb';
                setMostrarListaBancos(true);
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
              Valor do Boleto*
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
                placeholder="0,00"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  boxSizing: 'border-box',
                  backgroundColor: '#ffffff',
                  color: '#000000'
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
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box',
                backgroundColor: '#ffffff',
                color: '#000000',
                appearance: 'none',
                backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
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
            {isLoading ? 'Processando Pagamento...' : 'Confirmar Pagamento do Boleto'}
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
        title="Confirmar Pagamento de Boleto"
        message={`Você está prestes a pagar um boleto:\n\nBeneficiário: ${nomeBeneficiario}\nVencimento: ${new Date(dataVencimento).toLocaleDateString('pt-BR')}`}
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

export default PagamentoBoleto;
