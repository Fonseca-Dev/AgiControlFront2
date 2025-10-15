import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Menubar from "../Menubar/Menubar";
import Toast from "../../components/Toast";

// Definição da animação do spinner
const spinnerAnimation = `
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

// Adicionando o estilo ao documento
const style = document.createElement('style');
style.textContent = spinnerAnimation;
document.head.appendChild(style);

// Função auxiliar para formatar valores monetários de forma segura
const formatarValor = (valor: number | undefined | null): string => {
  if (valor === undefined || valor === null) return 'R$ 0,00';
  return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};


interface TransacaoCarteira {
  idConta: string;
  numeroConta: string;
  idcarteira: string;
  tipo: 'DEPOSITO_CARTEIRA' | 'SAQUE_CARTEIRA';
  data: string;
  dataHora: string;
  valor: number;
}

// Interface para a carteira da API
interface CarteiraAPI {
  id: string;
  nome: string;
  saldo: number;
  meta: number;
  estado: string;
}

// Interface para a requisição de alteração
interface AlterarCarteiraRequest {
  dataHoraLocal: string;
  nome: string;
  meta: number;
}

// Interface para a resposta da API
interface BaseResponse {
  mensagem: string;
  status: string;
  objeto: CarteiraAPI | null;
}

// Interface para a resposta da API ao buscar carteira
interface CarteiraResponse {
  mensagem: string;
  status: string;
  objeto: {
    id: string;
    nome: string;
    saldo: number;
    estado: string;
    meta: number;
  } | null;
}

const EditarCarteira: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [carteira, setCarteira] = useState<CarteiraAPI | null>(null);
  const [nomeCarteira, setNomeCarteira] = useState("");
  const [valorCarteira, setValorCarteira] = useState(0);
  const [iconeEscolhido, setIconeEscolhido] = useState("wallet");
  const [showEditNome, setShowEditNome] = useState(false);
  const [showPopupValor, setShowPopupValor] = useState(false);
  const [showPopupMeta, setShowPopupMeta] = useState(false);
  const [showSeletorIcone, setShowSeletorIcone] = useState(false);
  const [showPopupSaque, setShowPopupSaque] = useState(false);
  const [inputValor, setInputValor] = useState("");
  const [inputMeta, setInputMeta] = useState("");
  const [inputSaque, setInputSaque] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  // Interface para o tipo de transação
  // Usando a interface TransacaoCarteira definida acima

  const [saldoDisponivel, setSaldoDisponivel] = useState(0);
  const [saldoInicial, setSaldoInicial] = useState(0);
  const [metaCarteira, setMetaCarteira] = useState(0);
  
  // Estado para armazenar as transações
  const [transacoes, setTransacoes] = useState<TransacaoCarteira[]>([]);
  const [loadingTransacoes, setLoadingTransacoes] = useState(true);

  // URL base do backend
  const API_BASE_URL = 'https://sistema-gastos-694972193726.southamerica-east1.run.app';
  
  // Recalcula o saldo inicial sempre que as transações ou o saldo atual mudarem
  useEffect(() => {
    if (valorCarteira !== 0) {
      const novoSaldoInicial = calcularSaldoInicial(transacoes);
      setSaldoInicial(novoSaldoInicial);
    }
  }, [transacoes, valorCarteira]);

  // Função para buscar transações da carteira
  const buscarTransacoes = async () => {
    if (!id) return;

    const userID = localStorage.getItem('userID');
    const contaID = localStorage.getItem('contaID');

    if (!userID || !contaID) return;

    try {
      setLoadingTransacoes(true);
      const url = `${API_BASE_URL}/usuarios/${userID}/contas/${contaID}/carteiras/${id}/transacoes`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.objeto) {
          console.log('Exemplo de transação:', data.objeto[0]); // Log para debug
          setTransacoes(data.objeto);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar transações:', err);
    } finally {
      setLoadingTransacoes(false);
    }
  };

  // Função para buscar o ícone da carteira do localStorage
  const buscarIconeCarteira = () => {
    if (!id) return 'wallet';
    
    try {
      const iconesCarteiras = localStorage.getItem('iconesCarteiras');
      if (iconesCarteiras) {
        const icones = JSON.parse(iconesCarteiras);
        const iconeId = icones[id];
        console.log(`🔍 Ícone da carteira ${id}:`, iconeId);
        return iconeId || 'wallet';
      }
    } catch (error) {
      console.error('Erro ao buscar ícone da carteira:', error);
    }
    return 'wallet';
  };

  // Função para salvar o ícone da carteira no localStorage
  const salvarIconeCarteira = (iconeId: string) => {
    if (!id) {
      console.error('❌ ID da carteira não disponível');
      return;
    }

    try {
      const iconesCarteiras = localStorage.getItem('iconesCarteiras');
      const icones = iconesCarteiras ? JSON.parse(iconesCarteiras) : {};
      
      icones[id] = iconeId;
      localStorage.setItem('iconesCarteiras', JSON.stringify(icones));
      
      console.log('💾 Ícone salvo com sucesso:', {
        carteiraId: id,
        iconeId: iconeId,
        todosIcones: icones
      });
    } catch (error) {
      console.error('❌ Erro ao salvar ícone:', error);
    }
  };

  // Buscar dados da carteira específica
  // Função para calcular o saldo inicial da carteira
  const calcularSaldoInicial = (transacoes: TransacaoCarteira[]) => {
    // Se não houver transações, o saldo inicial é igual ao saldo atual
    if (transacoes.length === 0) {
      console.log('Nenhuma transação encontrada. Saldo inicial igual ao saldo atual:', valorCarteira);
      return valorCarteira;
    }

    // Soma todos os depósitos da carteira
    const totalDepositos = transacoes
      .filter(t => t.tipo === 'DEPOSITO_CARTEIRA')
      .reduce((acc, t) => acc + t.valor, 0);
    
    // Soma todos os saques da carteira
    const totalSaques = transacoes
      .filter(t => t.tipo === 'SAQUE_CARTEIRA')
      .reduce((acc, t) => acc + t.valor, 0);
    
    // Saldo inicial = saldo atual - total de depósitos + total de saques
    const saldoInicial = valorCarteira - totalDepositos + totalSaques;
    
    console.log('Cálculo do saldo inicial:', {
      saldoAtual: valorCarteira,
      totalDepositos,
      totalSaques,
      saldoInicial,
      quantidadeTransacoes: transacoes.length,
      transacoes: transacoes.map(t => ({
        tipo: t.tipo,
        valor: t.valor
      }))
    });
    
    return saldoInicial;
  };

  const buscarTransacoesCarteira = async () => {
    if (!id) return;

    const userID = localStorage.getItem('userID');
    const contaID = localStorage.getItem('contaID');

    if (!userID || !contaID) return;

    try {
      setLoadingTransacoes(true);
      const url = `${API_BASE_URL}/usuarios/${userID}/contas/${contaID}/carteiras/${id}/transacoes`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.objeto) {
          setTransacoes(data.objeto);
          // Calcular e atualizar o saldo inicial
          setSaldoInicial(calcularSaldoInicial(data.objeto));
        }
      }
    } catch (err) {
      console.error('Erro ao buscar transações:', err);
    } finally {
      setLoadingTransacoes(false);
    }
  };

  useEffect(() => {
    const buscarCarteira = async () => {
      if (!id) {
        setError('ID da carteira não fornecido');
        setIsLoading(false);
        return;
      }

      const userID = localStorage.getItem('userID');
      const contaID = localStorage.getItem('contaID');

      if (!userID || !contaID) {
        setError('IDs de usuário ou conta não encontrados. Faça login novamente.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const url = `${API_BASE_URL}/usuarios/${userID}/contas/${contaID}/carteiras/${id}`;
        console.log('Buscando carteira em:', url);

        const response = await fetch(url);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Carteira não encontrada');
          }
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data: CarteiraResponse = await response.json();
        console.log('Dados da carteira recebidos:', data);

        if (data.status === 'OK' && data.objeto) {
          setCarteira(data.objeto);
          setNomeCarteira(data.objeto.nome);
          setValorCarteira(data.objeto.saldo);
          setMetaCarteira(data.objeto.meta);
          setError(null);
        } else {
          throw new Error(data.mensagem || 'Erro ao buscar carteira');
        }
      } catch (err) {
        console.error('Erro ao buscar carteira:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    };

    // Buscar saldo disponível da conta
    const buscarSaldoConta = async () => {
      const userID = localStorage.getItem('userID');
      if (!userID) return;

      try {
        const url = `${API_BASE_URL}/usuarios/${userID}/contas`;
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.objeto && data.objeto.length > 0) {
            const ultimaConta = data.objeto[data.objeto.length - 1];
            setSaldoDisponivel(ultimaConta.saldo);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar saldo da conta:', err);
      }
    };

    buscarCarteira();
    buscarSaldoConta();
    buscarTransacoesCarteira();
    buscarTransacoes();
    
    // Carregar o ícone da carteira do localStorage
    const iconeCarregado = buscarIconeCarteira();
    setIconeEscolhido(iconeCarregado);
    console.log('🎨 Ícone carregado:', iconeCarregado);
  }, [id]);

  const icones = [
    { id: "wallet", name: "Carteira", svg: <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z"/> },
    { id: "piggy-bank", name: "Cofrinho", svg: <path d="M19 7c0-1.1-.9-2-2-2h-3V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v1H3c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7zm-8 0h2v2h-2V7zm0 4h2v2h-2v-2z"/> },
    { id: "credit-card", name: "Cartão", svg: <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/> },
    { id: "home", name: "Casa", svg: <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/> },
    { id: "car", name: "Carro", svg: <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/> },
    { id: "gift", name: "Presente", svg: <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/> }
  ];

  const handleSalvarMeta = async () => {
    if (!id) {
      setToast({ message: "ID da carteira não encontrado", type: 'error' });
      return;
    }

    if (!inputMeta.trim()) {
      setToast({ message: "Por favor, insira um valor para a meta", type: 'warning' });
      return;
    }

    const meta = converterMoedaParaNumero(inputMeta);
    
    if (isNaN(meta)) {
      setToast({ message: "Por favor, insira um valor numérico válido para a meta", type: 'error' });
      return;
    }

    if (meta === 0) {
      setToast({ message: "O valor da meta não pode ser zero", type: 'warning' });
      return;
    }

    if (meta < 0) {
      setToast({ message: "O valor da meta não pode ser negativo", type: 'error' });
      return;
    }

    if (meta < valorCarteira) {
      setToast({ message: `O valor da meta (R$ ${meta.toFixed(2)}) não pode ser menor que o valor atual da carteira (R$ ${valorCarteira.toFixed(2)})`, type: 'warning' });
      return;
    }

    const userID = localStorage.getItem('userID');
    const contaID = localStorage.getItem('contaID');

    if (!userID || !contaID) {
      setToast({ message: "Erro: IDs de usuário ou conta não encontrados. Faça login novamente.", type: 'error' });
      return;
    }

    setIsUpdating(true);

    try {
      const url = `${API_BASE_URL}/usuarios/${userID}/contas/${contaID}/carteiras/${id}`;
      
      const requestData: AlterarCarteiraRequest = {
        dataHoraLocal: formatarDataHoraLocal(),
        nome: nomeCarteira.trim(),
        meta: Number(meta.toFixed(2))
      };

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const data: BaseResponse = await response.json();

      if (response.ok) {
        if (data.objeto) {
          setMetaCarteira(data.objeto.meta);
          setCarteira(data.objeto);
          setToast({ message: "Meta atualizada com sucesso! 🎉", type: 'success' });
        }
        setShowPopupMeta(false);
        setInputMeta("");
      } else {
        switch (response.status) {
          case 404:
            if (data.mensagem.includes("Usuario nao encontrado")) {
              setToast({ message: "Erro: Usuário não encontrado.", type: 'error' });
            } else if (data.mensagem.includes("Conta nao encontrada")) {
              setToast({ message: "Erro: Conta não encontrada.", type: 'error' });
            } else if (data.mensagem.includes("Carteira nao encontrada")) {
              setToast({ message: "Erro: Carteira não encontrada.", type: 'error' });
            }
            break;
          case 403:
            if (data.mensagem.includes("Carteira nao pertence a conta")) {
              setToast({ message: "Erro: Esta carteira não pertence à conta informada.", type: 'error' });
            } else if (data.mensagem.includes("Conta nao pertence ao usuario")) {
              setToast({ message: "Erro: Esta conta não pertence ao usuário informado.", type: 'error' });
            }
            break;
          case 409:
            if (data.mensagem.includes("Ja existe uma carteira com esse nome")) {
              setToast({ message: "Erro: Já existe uma carteira com este nome.", type: 'error' });
            }
            break;
          default:
            setToast({ message: `Erro ao atualizar meta: ${data.mensagem || 'Erro desconhecido'}`, type: 'error' });
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      setToast({ message: "Erro de conexão. Verifique sua internet e tente novamente.", type: 'error' });
    } finally {
      setIsUpdating(false);
    }
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

  const renderIcone = (iconeId: string) => {
    const icone = icones.find(i => i.id === iconeId);
    if (!icone) return null;
    
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0065F5" strokeWidth="2">
        {icone.svg}
      </svg>
    );
  };

  // Função para editar o nome da carteira (PUT)
  const handleEditarNome = async (novoNome: string) => {
    if (!id || !novoNome.trim()) return;

    const userID = localStorage.getItem('userID');
    const contaID = localStorage.getItem('contaID');

    if (!userID || !contaID) {
      setToast({ message: 'IDs de usuário ou conta não encontrados. Faça login novamente.', type: 'error' });
      return;
    }

    try {
      setIsUpdating(true);
      const url = `${API_BASE_URL}/usuarios/${userID}/contas/${contaID}/carteiras/${id}`;
      
      const requestData: AlterarCarteiraRequest = {
        dataHoraLocal: formatarDataHoraLocal(),
        nome: novoNome.trim(),
        meta: carteira?.meta || 0
      };

      console.log('Editando carteira:', url, requestData);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const result = await response.json();
        setToast({ message: result.mensagem || "Nome atualizado com sucesso!", type: 'success' });
        setNomeCarteira(novoNome.trim());
      } else {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `Erro ${response.status}: ${response.statusText}`;
        setToast({ message: `Erro ao atualizar nome: ${errorMessage}`, type: 'error' });
      }
    } catch (error) {
      console.error('Erro ao editar nome:', error);
      setToast({ message: 'Erro de conexão ao atualizar nome.', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  // Função para formatar a data e hora local no padrão requerido
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

  // Função para excluir a carteira (DELETE)
  const handleExcluirCarteira = async () => {
    if (!id) return;

    const confirmacao = window.confirm('Tem certeza que deseja excluir esta carteira? Esta ação não pode ser desfeita.');
    if (!confirmacao) return;

    const userID = localStorage.getItem('userID');
    const contaID = localStorage.getItem('contaID');

    if (!userID || !contaID) {
      setToast({ message: 'IDs de usuário ou conta não encontrados. Faça login novamente.', type: 'error' });
      return;
    }

    try {
      setIsUpdating(true);
      const url = `${API_BASE_URL}/usuarios/${userID}/contas/${contaID}/carteiras/${id}`;
      
      console.log('Excluindo carteira:', url);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataHoraLocal: formatarDataHoraLocal()
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Carteira excluída:', result);
        setToast({ message: 'Carteira excluída com sucesso! 🎉', type: 'success' });
        setTimeout(() => {
          navigate('/carteira');
        }, 1500);
      } else {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `Erro ${response.status}: ${response.statusText}`;
        setToast({ message: `Erro ao excluir carteira: ${errorMessage}`, type: 'error' });
      }
    } catch (error) {
      console.error('Erro ao excluir carteira:', error);
      setToast({ message: 'Erro de conexão ao excluir carteira.', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  // Função para realizar depósito na carteira (POST)
  const realizarDeposito = async (valor: number) => {
    if (!id) return false;

    const userID = localStorage.getItem('userID');
    const contaID = localStorage.getItem('contaID');

    if (!userID || !contaID) {
      setToast({ message: 'IDs de usuário ou conta não encontrados. Faça login novamente.', type: 'error' });
      return false;
    }

    try {
      setIsUpdating(true);
      const url = `${API_BASE_URL}/usuarios/${userID}/contas/${contaID}/carteiras/${id}/transacoes/depositos`;
      
      const requestData = {
        dataHoraLocal: formatarDataHoraLocal(),
        valor: parseFloat(valor.toFixed(2))
      };

      console.log('Realizando depósito:', url, requestData);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Depósito realizado:', result);
        
        // Atualizar o saldo da carteira
        const novoSaldo = valorCarteira + valor;
        setValorCarteira(novoSaldo);
        
        // Atualizar saldo disponível da conta (subtraindo o valor depositado)
        setSaldoDisponivel(prev => prev - valor);
        
        return true;
      } else {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `Erro ${response.status}: ${response.statusText}`;
        setToast({ message: `Erro ao realizar depósito: ${errorMessage}`, type: 'error' });
        return false;
      }
    } catch (error) {
      console.error('Erro ao realizar depósito:', error);
      setToast({ message: 'Erro de conexão ao realizar depósito.', type: 'error' });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  // Função para realizar saque da carteira (POST)
  const realizarSaque = async (valor: number) => {
    if (!id) return false;

    const userID = localStorage.getItem('userID');
    const contaID = localStorage.getItem('contaID');

    if (!userID || !contaID) {
      setToast({ message: 'IDs de usuário ou conta não encontrados. Faça login novamente.', type: 'error' });
      return false;
    }

    try {
      setIsUpdating(true);
      const url = `${API_BASE_URL}/usuarios/${userID}/contas/${contaID}/carteiras/${id}/transacoes/saques`;
      
      const requestData = {
        dataHoraLocal: formatarDataHoraLocal(),
        valor: parseFloat(valor.toFixed(2))
      };

      console.log('Realizando saque:', url, requestData);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Saque realizado:', result);
        
        // Atualizar o saldo da carteira
        const novoSaldo = valorCarteira - valor;
        setValorCarteira(novoSaldo);
        
        // Atualizar saldo disponível da conta (adicionando o valor sacado)
        setSaldoDisponivel(prev => prev + valor);
        
        return true;
      } else {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `Erro ${response.status}: ${response.statusText}`;
        setToast({ message: `Erro ao realizar saque: ${errorMessage}`, type: 'error' });
        return false;
      }
    } catch (error) {
      console.error('Erro ao realizar saque:', error);
      setToast({ message: 'Erro de conexão ao realizar saque.', type: 'error' });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDepositar = async () => {
    const valorDeposito = converterMoedaParaNumero(inputValor);
    
    // Validações
    if (isNaN(valorDeposito) || valorDeposito <= 0) {
      setToast({ message: 'Por favor, insira um valor válido maior que zero.', type: 'warning' });
      return;
    }
    
    if (valorDeposito > saldoDisponivel) {
      setToast({ message: 'Valor do depósito não pode ser maior que o saldo disponível na conta.', type: 'error' });
      return;
    }

    // Realizar depósito via API
    const sucesso = await realizarDeposito(valorDeposito);
    
    if (sucesso) {
      setShowPopupValor(false);
      setInputValor("");
      setToast({ message: 'Depósito realizado com sucesso! 🎉', type: 'success' });
      // Atualizar o histórico de transações e recalcular saldo inicial
      await buscarTransacoesCarteira();
      // O saldo inicial será recalculado automaticamente em buscarTransacoesCarteira
    }
  };

  const handleSaque = async () => {
    const valorSaque = converterMoedaParaNumero(inputSaque);
    
    // Validações
    if (isNaN(valorSaque) || valorSaque <= 0) {
      setToast({ message: 'Por favor, insira um valor válido maior que zero.', type: 'warning' });
      return;
    }
    
    if (valorSaque > valorCarteira) {
      setToast({ message: 'Valor do saque não pode ser maior que o saldo da carteira.', type: 'error' });
      return;
    }

    // Realizar saque via API
    const sucesso = await realizarSaque(valorSaque);
    
    if (sucesso) {
      setShowPopupSaque(false);
      setInputSaque("");
      setToast({ message: 'Saque realizado com sucesso! 🎉', type: 'success' });
      // Atualizar o histórico de transações e recalcular saldo inicial
      await buscarTransacoesCarteira();
    }
  };

  // Estados de carregamento e erro
  if (isLoading) {
    return (
      <>
        <Menubar />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: 'white'
        }}>
          <div style={{ textAlign: 'center' , color:'blue'}}>
            <h2>Carregando carteira...</h2>
          </div>
        </div>
      </>
    );
  }

  if (error || !carteira) {
    return (
      <>
        <Menubar />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: 'white'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h2>{error || 'Carteira não encontrada'}</h2>
            <button 
              onClick={() => navigate('/carteira')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#0065F5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginTop: '16px'
              }}
            >
              Voltar
            </button>
          </div>
        </div>
      </>
    );
  }

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
        
        {/* Header fixo */}
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          height: '120px',
          backgroundColor: 'white',
          zIndex: 1002,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Botão de voltar dentro do header */}
          <div 
            style={{
              position: 'absolute',
              left: '24px',
              color: '#0065F5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              borderRadius: '50%'
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
        </div>

        {/* Card Principal */}
        <div style={{
          position: 'fixed',
          top: '25%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '332px',
          height: '193px',
          backgroundColor: 'white',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          padding: '16px',
          zIndex: 1002
        }}>
          
          {/* Título editável no canto superior esquerdo */}
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {showEditNome ? (
              <input
                value={nomeCarteira}
                onChange={(e) => setNomeCarteira(e.target.value)}
                onBlur={() => {
                  let nomeAtualizado = nomeCarteira.trim() === '' ? 'Nova carteira' : nomeCarteira;
                  setNomeCarteira(nomeAtualizado);
                  handleEditarNome(nomeAtualizado);
                  setShowEditNome(false);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    let nomeAtualizado = nomeCarteira.trim() === '' ? 'Nova carteira' : nomeCarteira;
                    setNomeCarteira(nomeAtualizado);
                    handleEditarNome(nomeAtualizado);
                    setShowEditNome(false);
                  }
                }}
                disabled={isUpdating}
                autoFocus
                style={{
                  border: '1px solid #0065F5',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '16px',
                  fontWeight: '800',
                  color: '#0065F5',
                  outline: 'none',
                  minWidth: '120px',
                  backgroundColor: isUpdating ? '#f8fafc' : 'white'
                }}
              />
            ) : (
              <span
                onClick={() => {
                  if (!isUpdating) {
                    setNomeCarteira('');
                    setShowEditNome(true);
                  }
                }}
                style={{
                  fontSize: '16px',
                  fontWeight: '800',
                  color: isUpdating ? '#94a3b8' : '#0065F5',
                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {nomeCarteira}
              </span>
            )}
            <button
              onClick={() => {
                if (!isUpdating) {
                  setNomeCarteira('');
                  setShowEditNome(true);
                }
              }}
              disabled={isUpdating}
              style={{
                background: 'none',
                border: 'none',
                cursor: isUpdating ? 'not-allowed' : 'pointer',
                padding: '4px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isUpdating ? "#94a3b8" : "#0065F5"} strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15.5 8 16l.5-4 9.5-9.5z"/>
              </svg>
            </button>
          </div>

          {/* Valor da carteira */}
          <div style={{
            position: 'absolute',
            top: '56px',
            left: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div
              onClick={() => setShowPopupValor(true)}
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#0065F5',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              {formatarValor(valorCarteira)}
            </div>
            
            {/* Saldo Inicial */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Saldo Inicial:</span>
              <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>
                {formatarValor(saldoInicial)}
              </span>
            </div>

            {/* Meta da Carteira */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Meta:</span>
              <span
                onClick={() => {
                  if (!isUpdating) {
                    setShowPopupMeta(true);
                  }
                }}
                style={{ 
                  fontSize: '14px',
                  color: '#1e293b',
                  fontWeight: '600',
                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>
                  {formatarValor(metaCarteira)}
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={isUpdating ? "#94a3b8" : "#0065F5"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15.5 8 16l.5-4 9.5-9.5z"/>
                </svg>
              </span>
            </div>

            {/* Valor que falta para a Meta */}
            {metaCarteira > 0 && valorCarteira < metaCarteira && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Falta:</span>
                <span style={{ 
                  fontSize: '14px',
                  color: 'black',
                  fontWeight: '600'
                }}>
                  {formatarValor(metaCarteira - valorCarteira)}
                </span>
              </div>
            )}

            {/* Meta Alcançada */}
            {metaCarteira > 0 && valorCarteira >= metaCarteira && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>✓ Meta alcançada!</span>
              </div>
            )}
          </div>

          {/* Ícone da carteira no canto inferior direito */}
          <div 
            onClick={() => setShowSeletorIcone(true)}
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              width: '48px',
              height: '48px',
              backgroundColor: '#fafafaff',
              borderRadius: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {renderIcone(iconeEscolhido)}
          </div>
        </div>

        {/* Container dos Botões */}
        <div style={{
          position: 'fixed',
          top: '37%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1002,
          display: 'flex',
          gap: '12px'
        }}>
          {/* Botão Depositar */}
          <button 
            onClick={() => setShowPopupValor(true)}
            disabled={isUpdating}
            style={{
              backgroundColor: isUpdating ? '#94a3b8' : '#0065F5',

              color: '#ffffffff',
              fontSize: '17px',
              fontWeight: '700',
              cursor: isUpdating ? 'not-allowed' : 'pointer',
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
            onClick={() => setShowPopupSaque(true)}
            disabled={isUpdating}
            style={{
              backgroundColor: isUpdating ? '#94a3b8' : '#0065F5',
              color: '#ffffff',
              fontSize: '17px',
              fontWeight: '700',
              cursor: isUpdating ? 'not-allowed' : 'pointer',
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

        {/* SVG Lixeira no canto superior direito */}
        <svg 
          onClick={handleExcluirCarteira}
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={isUpdating ? "#94a3b8" : "#0065F5"} 
          strokeWidth="2"
          style={{
            position: 'fixed',
            top: '48px',
            right: '35px',
            cursor: isUpdating ? 'not-allowed' : 'pointer',
            zIndex: 1003
          }}
        >
          <polyline points="3,6 5,6 21,6"/>
          <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
          <line x1="10" y1="11" x2="10" y2="17"/>
          <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>

        {/* Indicador de carregamento */}
        {isUpdating && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#0065F5',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            zIndex: 1003
          }}>
            Atualizando...
          </div>
        )}

        {/* Popup Valor */}
        {showPopupValor && (
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
                Depositar na carteira
              </h3>
              
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '5px'
              }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Saldo disponível: </span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#0065F5' }}>
                  {formatarValor(saldoDisponivel)}
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
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '5px',
                  fontSize: '16px',
                  marginBottom: '16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: 'white',
                  color: 'black'
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
                    backgroundColor: 'white',
                    color: '#64748b',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDepositar}
                  disabled={isUpdating}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    backgroundColor: isUpdating ? '#94a3b8' : '#0065F5',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isUpdating ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isUpdating ? 'Processando...' : 'Depositar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Popup Saque */}
        {showPopupSaque && (
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
                Realizar saque da carteira
              </h3>
              
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '5px'
              }}>
                <div style={{ marginTop: '0px' }}>
                  <span style={{ 
                    fontSize: '14px', 
                    color: '#64748b' 
                    }}>Saldo atual: </span>
                  <span style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#0065F5' 
                    }}>
                    R$ {valorCarteira.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <input
                type="text"
                placeholder="0,00"
                value={inputSaque}
                onChange={(e) => {
                  const valorFormatado = formatarMoedaBrasileira(e.target.value);
                  setInputSaque(valorFormatado);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '5px',
                  fontSize: '16px',
                  marginBottom: '16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: 'white',
                  color: 'black'
                }}
              />

              <div style={{
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  onClick={() => setShowPopupSaque(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: 'white',
                    color: '#64748b',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaque}
                  disabled={isUpdating}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    backgroundColor: isUpdating ? '#94a3b8' : '#0065F5',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isUpdating ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isUpdating ? 'Processando...' : 'Sacar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Card Wrapper de Transações */}
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '364px',
          height: '300px',
          backgroundColor: 'white',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          padding: '16px 16px 0px 16px',
          zIndex: 1002
        }}>
          <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              Histórico de Transações
            </h3>
          {/* Card de Transações */}
          <div style={{
            width: '100%',
            backgroundColor: 'transparent',
            borderRadius: '16px',
            padding: '16px',
            maxHeight: '35vh',
            overflowY: 'auto',
            height: '200px'
            
          }}>

          {loadingTransacoes ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '20px'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                border: '2px solid #e2e8f0',
                borderTop: '2px solid #0065F5',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          ) : transacoes.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#64748b',
              padding: '20px'
            }}>
              Nenhuma transação encontrada
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {transacoes.map((transacao, index) => (
                <div key={index} style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1e293b'
                    }}>
                      {transacao.tipo === 'DEPOSITO_CARTEIRA' ? 'Depósito' : 'Saque'}
                    </span>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: transacao.tipo === 'DEPOSITO_CARTEIRA' ? '#16a34a' : '#dc2626'
                    }}>
                      {transacao.tipo === 'DEPOSITO_CARTEIRA' ? '+' : '-'}
                      {formatarValor(transacao.valor)}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      color: '#64748b'
                    }}>
                      {(() => {
                        try {
                          const dataObj = new Date(transacao.data);
                          
                          // Verificando se a data é válida
                          if (isNaN(dataObj.getTime())) {
                            return 'Data indisponível';
                          }

                          const dataFormatada = dataObj.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          });
                          const horaFormatada = dataObj.toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                          return `${dataFormatada} às ${horaFormatada}`;
                        } catch (error) {
                          console.error('Erro ao formatar data:', error);
                          return 'Data indisponível';
                        }
                      })()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>

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
                      salvarIconeCarteira(icone.id);
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

        {/* Popup Meta */}
        {showPopupMeta && (
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
                Definir Meta da Carteira
              </h3>
              
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '5px'
              }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Valor atual da carteira: </span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#0065F5' }}>
                  R$ {valorCarteira.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

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
                  borderRadius: '5px',
                  fontSize: '16px',
                  marginBottom: '16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: isUpdating ? '#f8fafc' : 'white',
                  color: 'black'
                }}
                disabled={isUpdating}
              />

              <div style={{
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  onClick={() => {
                    setShowPopupMeta(false);
                    setInputMeta('');
                  }}
                  disabled={isUpdating}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: 'white',
                    color: isUpdating ? '#94a3b8' : '#64748b',
                    fontSize: '14px',
                    cursor: isUpdating ? 'not-allowed' : 'pointer',
                    opacity: isUpdating ? 0.7 : 1
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarMeta}
                  disabled={isUpdating}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    backgroundColor: isUpdating ? '#94a3b8' : '#0065F5',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isUpdating ? 'not-allowed' : 'pointer',
                    opacity: isUpdating ? 0.7 : 1
                  }}
                >
                  {isUpdating ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </>
  );
};

export default EditarCarteira;

