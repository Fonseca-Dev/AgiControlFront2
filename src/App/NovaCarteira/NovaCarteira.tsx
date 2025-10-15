import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Menubar from "../Menubar/Menubar";
import Toast from "../../components/Toast";

const NovaCarteira: React.FC = () => {
  const navigate = useNavigate();
  const [nomeCarteira, setNomeCarteira] = useState("Nova carteira");
  const [valorCarteira, setValorCarteira] = useState(0);
  const [valorMeta, setValorMeta] = useState(0);
  const [showEditNome, setShowEditNome] = useState(false);
  const [showPopupValor, setShowPopupValor] = useState(false);
  const [showPopupMeta, setShowPopupMeta] = useState(false);
  const [inputMeta, setInputMeta] = useState("");
  const [showSeletorIcone, setShowSeletorIcone] = useState(false);
  const [iconeEscolhido, setIconeEscolhido] = useState("wallet");
  const [inputValor, setInputValor] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [saldoDisponivel, setSaldoDisponivel] = useState(0);
  const [isLoadingSaldo, setIsLoadingSaldo] = useState(true);
  const [userID, setUserID] = useState<string | null>(null);
  const [contaID, setContaID] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  
  // URL base do backend - SEM /api (baseado no teste anterior)
  const API_BASE_URL = 'https://sistema-gastos-694972193726.southamerica-east1.run.app';

  // Buscar saldo disponível da conta do usuário
  useEffect(() => {
    const usuarioId = localStorage.getItem("userID");
    console.log('UserID obtido do localStorage:', usuarioId);

    if (usuarioId) {
      setUserID(usuarioId);
      setIsLoadingSaldo(true);
      
      const urlContas = `${API_BASE_URL}/usuarios/${usuarioId}/contas`;
      console.log('Fazendo requisição para buscar contas:', urlContas);
      
      fetch(urlContas)
        .then(res => {
          console.log('Status da resposta (buscar contas):', res.status);
          if (!res.ok) {
            throw new Error(`Erro ao buscar contas: ${res.status} ${res.statusText}`);
          }
          return res.json();
        })
        .then(data => {
          console.log('Dados das contas recebidos:', data);
          if (data && data.objeto && data.objeto.length > 0) {
            // pega a ÚLTIMA conta do array
            const ultimaConta = data.objeto[data.objeto.length - 1];
            console.log('Última conta encontrada:', ultimaConta);
            setSaldoDisponivel(ultimaConta.saldo);
            setContaID(ultimaConta.id);
            localStorage.setItem("contaID", ultimaConta.id);
            console.log('ContaID salvo no localStorage:', ultimaConta.id);
          } else {
            console.warn('Nenhuma conta encontrada nos dados:', data);
          }
        })
        .catch(err => {
          console.error("Erro ao buscar saldo:", err);
          // Em caso de erro, manter um valor padrão
          setSaldoDisponivel(0);
        })
        .finally(() => {
          setIsLoadingSaldo(false);
        });
    } else {
      console.warn('UserID não encontrado no localStorage');
      setIsLoadingSaldo(false);
    }
  }, []);

  const icones = [
    { id: "wallet", name: "Carteira", svg: <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z"/> },
    { id: "piggy-bank", name: "Cofrinho", svg: <path d="M19 7c0-1.1-.9-2-2-2h-3V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v1H3c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7zm-8 0h2v2h-2V7zm0 4h2v2h-2v-2z"/> },
    { id: "credit-card", name: "Cartão", svg: <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/> },
    { id: "home", name: "Casa", svg: <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/> },
    { id: "car", name: "Carro", svg: <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/> },
    { id: "gift", name: "Presente", svg: <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/> }
  ];

  const renderIcone = (iconeId: string) => {
    const icone = icones.find(i => i.id === iconeId);
    if (!icone) return null;
    
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0065F5" strokeWidth="2">
        {icone.svg}
      </svg>
    );
  };

  // Função para formatar valor como moeda brasileira enquanto digita
  const formatarMoedaBrasileira = (valor: string) => {
    // Remove tudo que não é número
    const apenasNumeros = valor.replace(/\D/g, '');
    
    // Converte para número e divide por 100 para ter os centavos
    const numero = parseInt(apenasNumeros || '0') / 100;
    
    // Formata como moeda brasileira
    return numero.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função para converter string formatada para número
  const converterMoedaParaNumero = (valorFormatado: string): number => {
    // Remove pontos de milhar e substitui vírgula por ponto
    const valorLimpo = valorFormatado.replace(/\./g, '').replace(',', '.');
    return parseFloat(valorLimpo);
  };

  const handleSalvarValor = () => {
    if (!inputValor.trim()) {
      setToast({ message: "Por favor, insira um valor inicial para a carteira.", type: 'warning' });
      return;
    }

    const valor = converterMoedaParaNumero(inputValor);
    
    if (isNaN(valor)) {
      setToast({ message: "Por favor, insira um valor numérico válido.", type: 'error' });
      return;
    }

    if (valor === 0) {
      setToast({ message: "O valor inicial da carteira não pode ser zero.", type: 'warning' });
      return;
    }

    if (valor < 0) {
      setToast({ message: "O valor inicial da carteira não pode ser negativo.", type: 'error' });
      return;
    }

    if (valor > saldoDisponivel) {
      setToast({ message: `O valor inicial (R$ ${valor.toFixed(2)}) não pode ser maior que o saldo disponível (R$ ${saldoDisponivel.toFixed(2)}).`, type: 'error' });
      return;
    }

    setValorCarteira(valor);
    setShowPopupValor(false);
    setInputValor("");
  };

  const handleSalvarMeta = () => {
    if (!inputMeta.trim()) {
      setToast({ message: "Por favor, insira um valor para a meta.", type: 'warning' });
      return;
    }

    const meta = converterMoedaParaNumero(inputMeta);
    
    if (isNaN(meta)) {
      setToast({ message: "Por favor, insira um valor numérico válido para a meta.", type: 'error' });
      return;
    }

    if (meta === 0) {
      setToast({ message: "O valor da meta não pode ser zero.", type: 'warning' });
      return;
    }

    if (meta < 0) {
      setToast({ message: "O valor da meta não pode ser negativo.", type: 'error' });
      return;
    }

    if (meta < valorCarteira) {
      setToast({ message: `O valor da meta (R$ ${meta.toFixed(2)}) não pode ser menor que o valor inicial da carteira (R$ ${valorCarteira.toFixed(2)}).`, type: 'warning' });
      return;
    }

    setValorMeta(meta);
    setShowPopupMeta(false);
    setInputMeta("");
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

  const handleCriarCarteira = async () => {
    console.log('=== INICIANDO CRIAÇÃO DE CARTEIRA ===');
    
    // Validações do nome da carteira
    if (!nomeCarteira || !nomeCarteira.trim()) {
      setToast({ message: "O nome da carteira não pode estar vazio.", type: 'warning' });
      return;
    }

    // Validações do valor inicial da carteira
    if (valorCarteira === 0) {
      setToast({ message: "O valor inicial da carteira não pode ser zero.", type: 'warning' });
      return;
    }

    if (valorCarteira < 0) {
      setToast({ message: "O valor inicial da carteira não pode ser negativo.", type: 'error' });
      return;
    }

    if (valorCarteira > saldoDisponivel) {
      setToast({ message: `O valor inicial da carteira (R$ ${valorCarteira.toFixed(2)}) não pode ser maior que o saldo disponível (R$ ${saldoDisponivel.toFixed(2)}).`, type: 'error' });
      return;
    }

    // Validações da meta
    if (valorMeta === 0) {
      setToast({ message: "O valor da meta não pode ser zero.", type: 'warning' });
      return;
    }

    if (valorMeta < 0) {
      setToast({ message: "O valor da meta não pode ser negativo.", type: 'error' });
      return;
    }

    if (valorMeta < valorCarteira) {
      setToast({ message: `O valor da meta (R$ ${valorMeta.toFixed(2)}) não pode ser menor que o valor inicial da carteira (R$ ${valorCarteira.toFixed(2)}).`, type: 'warning' });
      return;
    }

    // Obter IDs do localStorage e dos estados
    const currentUserID = userID || localStorage.getItem('userID');
    const currentContaID = contaID || localStorage.getItem('contaID');

    console.log('UserID atual:', currentUserID);
    console.log('ContaID atual:', currentContaID);

    if (!currentUserID) {
      setToast({ message: "Erro: ID de usuário não encontrado. Faça login novamente.", type: 'error' });
      console.error('UserID não encontrado');
      return;
    }

    if (!currentContaID) {
      setToast({ message: "Erro: ID da conta não encontrado. Aguarde o carregamento dos dados ou faça login novamente.", type: 'error' });
      console.error('ContaID não encontrado');
      return;
    }

    setIsLoading(true);

    try {
      // Preparar dados para envio
      const requestData = {
        dataHoraLocal: formatarDataHoraLocal(), // Formato garantido pela função
        nome: nomeCarteira.trim(), // @NotBlank validado anteriormente
        saldo: Number(valorCarteira.toFixed(2)), // @NotNull BigDecimal garantido com 2 casas decimais
        meta: Number(valorMeta.toFixed(2)) // @NotNull BigDecimal garantido com 2 casas decimais
      };

      // Construir URL completa com base do backend
      const url = `${API_BASE_URL}/usuarios/${currentUserID}/contas/${currentContaID}/carteiras`;

      console.log('=== DADOS DA REQUISIÇÃO ===');
      console.log('URL completa:', url);
      console.log('Método:', 'POST');
      console.log('Headers:', { 'Content-Type': 'application/json' });
      console.log('Body (dados):', requestData);
      console.log('Tipo do saldo:', typeof requestData.saldo);
      console.log('Valor do saldo:', requestData.saldo);
      console.log('Body (JSON):', JSON.stringify(requestData));

      // Fazer requisição POST para o backend
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      console.log('=== RESPOSTA DA REQUISIÇÃO ===');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));
      
      // Tentar ler o corpo da resposta como texto primeiro
      const responseText = await response.text();
      console.log('Corpo da resposta (texto):', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('Corpo da resposta (JSON):', responseData);
      } catch (e) {
        console.error('Erro ao fazer parse do JSON da resposta:', e);
        responseData = null;
      }

      if (response.ok) {
        console.log('✅ Carteira criada com sucesso:', responseData);
        
        // Salvar o ícone escolhido no localStorage associado ao ID da carteira
        if (responseData && responseData.objeto && responseData.objeto.id) {
          const carteiraId = responseData.objeto.id;
          const iconesCarteiras = JSON.parse(localStorage.getItem('iconesCarteiras') || '{}');
          iconesCarteiras[carteiraId] = iconeEscolhido;
          localStorage.setItem('iconesCarteiras', JSON.stringify(iconesCarteiras));
          console.log('🎨 Ícone salvo com sucesso:', { carteiraId, icone: iconeEscolhido });
        } else {
          console.error('⚠️ ID da carteira não retornado pelo backend. Ícone não foi salvo.');
          console.error('📋 Estrutura recebida:', responseData);
        }
        
        setToast({ message: "Carteira criada com sucesso! 🎉", type: 'success' });
        
        // Navegar de volta para a página de carteiras após delay
        setTimeout(() => {
          navigate('/carteira');
        }, 1500);
      } else {
        // Tratar erros HTTP - usar responseData que já foi parseado
        const errorData = responseData;
        
        // A API retorna 'mensagem' (não 'message')
        const errorMessage = errorData?.mensagem || errorData?.message || `Erro ${response.status}: ${response.statusText}`;
        console.error('=== ERRO NA RESPOSTA ===');
        console.error('Status:', response.status);
        console.error('Dados do erro completo:', JSON.stringify(errorData, null, 2));
        console.error('Mensagem de erro:', errorMessage);
        
        // Verificar se há informações adicionais no errorData
        if (errorData) {
          console.error('Objeto errorData:', errorData);
          if (errorData.objeto) {
            console.error('errorData.objeto:', errorData.objeto);
          }
        }
        
        // Tratamento baseado no status HTTP retornado pelo backend
        switch (response.status) {
          case 400: // BAD_REQUEST
            // Request nulo, saldo inválido, etc
            setToast({ message: errorMessage, type: 'error' });
            break;
          case 404: // NOT_FOUND
            // Usuário ou conta não encontrada
            setToast({ message: errorMessage, type: 'error' });
            break;
          case 409: // CONFLICT
            // Conta não pertence ao usuário, conta deletada, carteira já existe, 
            // saldo insuficiente, meta menor que saldo inicial
            setToast({ message: errorMessage, type: 'error' });
            break;
          case 500: // INTERNAL_SERVER_ERROR
            // Erro interno do servidor
            const detalheErro = errorData?.objeto || errorData?.detalhes || errorMessage;
            console.error('Detalhes do erro 500:', detalheErro);
            setToast({ 
              message: `Erro interno do servidor. ${typeof detalheErro === 'string' ? detalheErro : errorMessage}`, 
              type: 'error' 
            });
            break;
          default:
            setToast({ message: `Erro ao criar carteira: ${errorMessage}`, type: 'error' });
        }
      }
    } catch (error: unknown) {
      console.error('=== ERRO NA REQUISIÇÃO ===');
      
      if (error instanceof Error) {
        console.error('Tipo do erro:', error.constructor.name);
        console.error('Mensagem do erro:', error.message);
        console.error('Stack trace:', error.stack);
      } else {
        console.error('Erro desconhecido:', error);
      }

      setToast({ message: 'Erro de conexão. Verifique sua internet e tente novamente.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <Menubar />
      
      {/* Background branco */}
      <div style={{
        position: 'fixed',
        left: '0px',
        right: '0px',
        top: '0px', 
        bottom: '0px', 
        width: '100%',
        backgroundColor: 'white',
        zIndex: 999
      }}>
        
        {/* Botão voltar */}
        <div 
          style={{
            position: 'fixed',
            top: '20px',
            left: '24px',
            color: '#0065F5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            zIndex: 1002
          }}
          onClick={() => navigate(-1)}
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

        {/* Card Principal */}
        <div style={{
          position: 'fixed',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '332px',
          backgroundColor: 'white',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          padding: '24px',
          zIndex: 1002
        }}>
          {/* Seção Nome da Carteira */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#64748b',
              marginBottom: '8px',
              display: 'block'
            }}>
              Nome da carteira
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f8fafc',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              {showEditNome ? (
                <input
                  value={nomeCarteira}
                  onChange={(e) => setNomeCarteira(e.target.value)}
                  onBlur={() => setShowEditNome(false)}
                  onKeyPress={(e) => e.key === 'Enter' && setShowEditNome(false)}
                  placeholder="Digite o nome da carteira"
                  autoFocus
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#0065F5',
                    outline: 'none',
                    width: '100%'
                  }}
                />
              ) : (
                <div
                  onClick={() => setShowEditNome(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#0065F5'
                  }}>
                    {nomeCarteira}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0065F5" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15.5 8 16l.5-4 9.5-9.5z"/>
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Seção Valor da Carteira */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#64748b',
              marginBottom: '8px',
              display: 'block'
            }}>
              Valor inicial da carteira
            </label>
            <div
              onClick={() => setShowPopupValor(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f8fafc',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                cursor: 'pointer'
              }}
            >
              <span style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#0065F5'
              }}>
                R$ {valorCarteira.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0065F5" strokeWidth="2">
                <path d="M3 12h18M12 3v18"/>
              </svg>
            </div>
            <div style={{
              fontSize: '12px',
              color: '#94a3b8',
              marginTop: '4px',
              paddingLeft: '4px'
            }}>
              Clique para definir o valor que deseja guardar nesta carteira
            </div>
          </div>

          {/* Seção Meta da Carteira */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#64748b',
              marginBottom: '8px',
              display: 'block'
            }}>
              Meta da carteira
            </label>
            <div
              onClick={() => setShowPopupMeta(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f8fafc',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                cursor: 'pointer'
              }}
            >
              <span style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#0065F5'
              }}>
                R$ {valorMeta.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0065F5" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div style={{
              fontSize: '12px',
              color: '#94a3b8',
              marginTop: '4px',
              paddingLeft: '4px'
            }}>
              Defina uma meta para acompanhar seu progresso
            </div>
          </div>

          {/* Seção Ícone da Carteira */}
          <div>
            <label style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#64748b',
              marginBottom: '8px',
              display: 'block'
            }}>
              Ícone da carteira
            </label>
            <div
              onClick={() => setShowSeletorIcone(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#f8fafc',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#fff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>
                {renderIcone(iconeEscolhido)}
              </div>
              <div style={{
                flex: 1,
                fontSize: '14px',
                color: '#64748b'
              }}>
                Clique para escolher um ícone
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0065F5" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Botão Criar Carteira */}
        <button
          onClick={handleCriarCarteira}
          disabled={isLoading || isLoadingSaldo || !userID || !contaID}
          style={{
            position: 'fixed',
            bottom: '170px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '332px',
            height: '47px',
            backgroundColor: (isLoading || isLoadingSaldo || !userID || !contaID) ? '#94a3b8' : '#0065F5',
            color: 'white',
            border: 'none',
            fontSize: '16px',
            fontWeight: '600',
            cursor: (isLoading || isLoadingSaldo || !userID || !contaID) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            zIndex: 1002
          }}
        >
          {isLoading ? 'Criando...' : 
           isLoadingSaldo ? 'Carregando...' : 
           !userID || !contaID ? 'Aguardando dados...' : 
           'Criar carteira'}
        </button>

        {/* Popup Valor */}
        {showPopupValor && (
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              width: '320px',
              boxShadow: '0 10px 25px rgba(255, 255, 255, 0.3)'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                Definir valor da carteira
              </h3>
              
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px'
              }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Saldo disponível: </span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#0065F5' }}>
                  {isLoadingSaldo ? 
                    'Carregando...' : 
                    `R$ ${saldoDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  }
                </span>
              </div>

              <input
                type="text"
                placeholder="0,00"
                value={inputValor}
                onChange={(e) => {
                  const valorFormatado = formatarMoedaBrasileira(e.target.value);
                  setInputValor(valorFormatado);
                }}
                disabled={isLoadingSaldo}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  marginBottom: '16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              <div style={{
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  onClick={() => setShowPopupValor(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    color: '#64748b',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarValor}
                  disabled={isLoadingSaldo}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: isLoadingSaldo ? '#94a3b8' : '#0065F5',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isLoadingSaldo ? 'not-allowed' : 'pointer'
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Popup Meta */}
        {showPopupMeta && (
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              width: '320px',
              boxShadow: '0 10px 25px rgba(255, 255, 255, 0.3)'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                Definir meta da carteira
              </h3>

              <input
                type="text"
                placeholder="0,00"
                value={inputMeta}
                onChange={(e) => {
                  const valorFormatado = formatarMoedaBrasileira(e.target.value);
                  setInputMeta(valorFormatado);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  marginBottom: '16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              <div style={{
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  onClick={() => setShowPopupMeta(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    color: '#64748b',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarMeta}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: '#0065F5',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Popup Seletor de Ícones */}
        {showSeletorIcone && (
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              width: '320px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                Escolher ícone
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '16px'
              }}>
                {icones.map((icone) => (
                  <button
                    key={icone.id}
                    onClick={() => {
                      setIconeEscolhido(icone.id);
                      setShowSeletorIcone(false);
                    }}
                    style={{
                      padding: '16px',
                      border: iconeEscolhido === icone.id ? '2px solid #0065F5' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      backgroundColor: iconeEscolhido === icone.id ? '#f0f9ff' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                      {icone.svg}
                    </svg>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{icone.name}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowSeletorIcone(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: '#64748b',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
        
      </div>
    </>
  );
};

export default NovaCarteira;

