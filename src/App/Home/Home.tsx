import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Bell, MessageCircle, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Menubar from "../Menubar/Menubar";
import { Doughnut, Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import type { ChartEvent, ActiveElement } from 'chart.js';
import pixIcon from '../../assets/images/pix.png';

interface Transacao {
  data: string;
  tipo: string;
  valor: number;
  categoria: string;
}
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);


// Componente de Skeleton para valores
const ValueSkeleton = ({ width = '100%' }: { width?: string }) => (
  <div style={{
    height: '24px',
    width: width,
    backgroundColor: '#f1f5f9',
    borderRadius: '4px',
    animation: 'pulse 1.5s infinite'
  }}></div>
);

// Adicionar estilos de animação para os indicadores
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  @keyframes slideIn {
    from { 
      opacity: 0;
      transform: translateY(-10px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes saldoBounce {
    0%, 100% { 
      transform: scale(1);
    }
    25% { 
      transform: scale(1.1);
    }
    50% { 
      transform: scale(0.95);
    }
    75% { 
      transform: scale(1.05);
    }
  }
  @keyframes highlightGreen {
    0%, 100% { 
      background-color: transparent;
      box-shadow: 0 0 0 rgba(34, 197, 94, 0);
    }
    50% { 
      background-color: rgba(34, 197, 94, 0.1);
      box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
    }
  }
`;
if (!document.head.querySelector('style[data-home-animations]')) {
  styleSheet.setAttribute('data-home-animations', 'true');
  document.head.appendChild(styleSheet);
}


interface RespostaTransacoes {
  mensagem: string;
  status: string;
  objeto: Transacao[];
}

interface Transacao {
  id?: string;
  idTransacao?: string;
  data: string;
  tipo: string;
  valor: number;
  categoria: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = React.useState(false);
  const [saldo, setSaldo] = useState<number | null>(null);
  const [numeroConta, setNumeroConta] = useState<string | null>(null);

  const [transacoesSelecionadas, setTransacoesSelecionadas] = useState<Transacao[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('');
  const [origemSelecao, setOrigemSelecao] = useState<'grafico-categoria' | 'grafico-diario'>('grafico-diario');
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  const [isLoadingSaldo, setIsLoadingSaldo] = useState(true);
  const [isLoadingGastos, setIsLoadingGastos] = useState(true);
  const [isLoadingTransacoes, setIsLoadingTransacoes] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [detalhesTransacao, setDetalhesTransacao] = useState<{[key: number]: any}>({});

  // Função para formatar o tipo de transação
  const formatarTipoTransacao = (tipo: string): string => {
    switch (tipo) {
      case 'PAGAMENTO_DEBITO':
        return 'Débito';
      case 'PIX':
      case 'PIX_ENVIADO':
        return 'Pix';
      case 'PIX_RECEBIDO':
        return 'Pix Recebido';
      case 'PAGAMENTO_BOLETO':
        return 'Boleto';
      case 'TRANSFERENCIA_INTERNA':
      case 'TRANSFERENCIA_EXTERNA':
        return 'TED';
      case 'DEPOSITO_CONTA':
        return 'Depósito';
      case 'SAQUE_CONTA':
        return 'Saque';
      case 'DEPOSITO_CARTEIRA':
        return 'Depósito em Carteira';
      case 'SAQUE_CARTEIRA':
        return 'Saque da Carteira';
      default:
        return tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase().replace(/_/g, ' ');
    }
  };
  const [userAvatar, setUserAvatar] = React.useState<string | null>(() => {
    return localStorage.getItem('userAvatar') || null;
  });
  const [userName] = React.useState<string>(() => {
    return localStorage.getItem('userName') || 'Usuário';
  });

  const [activeSection, setActiveSection] = useState<'controle' | 'graficos' | 'relatorios'>('controle');
  const [gastoHoje, setGastoHoje] = useState<number>(0);
  const [maiorGastoMesAnterior, setMaiorGastoMesAnterior] = useState<{categoria: string, valor: number} | null>(null);
  const [gastosDiarios, setGastosDiarios] = useState<Array<{
    date: string;
    [key: string]: string | number;
  }>>([]);
  const [mesSelecionadoGrafico, setMesSelecionadoGrafico] = useState<string>(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });
  const [gastosPorCategoria, setGastosPorCategoria] = useState<Array<{name: string, value: number, color: string}>>([]);
  const [gastosMensais, setGastosMensais] = useState<Array<{
    date: string;
    [key: string]: string | number;
  }>>([]);
  const [anoSelecionadoGrafico, setAnoSelecionadoGrafico] = useState<number>(() => {
    const hoje = new Date();
    return hoje.getFullYear();
  });
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [isAnoSelectOpen, setIsAnoSelectOpen] = useState(false);

  // Estado para controlar o arrasto do gráfico anual
  const [isDraggingAnual, setIsDraggingAnual] = useState(false);
  const [startXAnual, setStartXAnual] = useState(0);
  const [scrollLeftAnual, setScrollLeftAnual] = useState(0);
  const graficoAnualRef = React.useRef<HTMLDivElement>(null);
  
  // Estados para controlar as setas de navegação
  const [canScrollLeftAnual, setCanScrollLeftAnual] = useState(false);
  const [canScrollRightAnual, setCanScrollRightAnual] = useState(true);

  const [gastosPorTipo, setGastosPorTipo] = useState<{
    pix: number;
    debito: number;
    boleto: number;
    transferencia: number;
  }>({
    pix: 0,
    debito: 0,
    boleto: 0,
    transferencia: 0
  });

  const [gastosPorTipoMensal, setGastosPorTipoMensal] = useState<{
    pix: number;
    debito: number;
    boleto: number;
    transferencia: number;
  }>({
    pix: 0,
    debito: 0,
    boleto: 0,
    transferencia: 0
  });

  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([]);

  const [isSelectOpen, setIsSelectOpen] = useState(false);

  // Estados para o gráfico anual interativo
  const [mesSelecionadoAnual, setMesSelecionadoAnual] = useState<string | null>(null);
  const [gastosMesAnual, setGastosMesAnual] = useState<Array<{
    tipoGasto: string;
    totalGasto: number;
  }>>([]);
  const [isLoadingGraficoAnual, setIsLoadingGraficoAnual] = useState(false);
  const [isNavigatingToRelatorios, setIsNavigatingToRelatorios] = useState(false);
  
  // Estado para as transações individuais do mês
  const [transacoesDoMes, setTransacoesDoMes] = useState<Array<{
    data: string;
    tipo: string;
    valor: number;
  }>>([]);
  const [isLoadingTransacoesDoMes, setIsLoadingTransacoesDoMes] = useState(false);

  // Função para buscar os meses disponíveis com transações
  const fetchMesesDisponiveis = async () => {
    const usuarioId = localStorage.getItem("userID");
    const contaId = localStorage.getItem("contaID");
    
    if (!usuarioId || !contaId) return;

    try {
      const url = `https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas/${contaId}/transacoes`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.objeto && Array.isArray(data.objeto)) {
        // Extrair meses únicos das transações
        const meses = data.objeto.map((transacao: any) => {
          const date = new Date(transacao.data);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        });
        
        // Remover duplicatas e ordenar do mais recente para o mais antigo
        const mesesUnicos = Array.from(new Set(meses)).sort().reverse() as string[];
        setMesesDisponiveis(mesesUnicos);
      }
    } catch (error) {
      console.error("Erro ao buscar meses disponíveis:", error);
    }
  };

  // Função para buscar os anos disponíveis com transações
  const fetchAnosDisponiveis = async () => {
    const usuarioId = localStorage.getItem("userID");
    const contaId = localStorage.getItem("contaID");
    
    if (!usuarioId || !contaId) return;

    try {
      const url = `https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas/${contaId}/transacoes`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.objeto && Array.isArray(data.objeto)) {
        // Extrair anos únicos das transações
        const anos = data.objeto.map((transacao: any) => {
          const date = new Date(transacao.data);
          return date.getFullYear();
        });
        
        // Remover duplicatas e ordenar do mais recente para o mais antigo
        const anosUnicos = Array.from(new Set(anos)).sort((a: any, b: any) => (b as number) - (a as number)) as number[];
        setAnosDisponiveis(anosUnicos);
      }
    } catch (error) {
      console.error("Erro ao buscar anos disponíveis:", error);
    }
  };

  // Função para buscar dados dos gastos mensais do ano
  const buscarDadosAnuais = async (anoSelecionado?: number) => {
    const usuarioId = localStorage.getItem("userID");
    const contaId = localStorage.getItem("contaID");
    
    if (!usuarioId || !contaId) return;

    try {
      const ano = anoSelecionado || anoSelecionadoGrafico;
      
      const url = `https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas/${contaId}/transacoes/gastosPorMesAno?ano=${ano}`;
      console.log('Buscando dados anuais:', url);
      const response = await fetch(url);
      const data = await response.json();
      
      if (data?.status === "OK" && Array.isArray(data.objeto)) {
        console.log('Dados anuais recebidos:', JSON.stringify(data.objeto, null, 2));
        
        // Criar um array com todos os 12 meses do ano
        const mesesDoAno = [
          'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
          'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
        ];
        
        // Inicializar todos os meses com valor 0
        const dadosMensaisCompletos = mesesDoAno.map((mes) => ({
          date: mes,
          total: 0
        }));

        // Processar os dados recebidos da API
        data.objeto.forEach((mesData: any) => {
          const dataObj = new Date(mesData.mes);
          const mesIndex = dataObj.getMonth(); // 0-11
          
          // Adicionar o total de gastos ao mês correspondente
          dadosMensaisCompletos[mesIndex].total = mesData.totalGasto || 0;
        });
        
        console.log('Dados processados:', dadosMensaisCompletos);
        setGastosMensais(dadosMensaisCompletos);
      }
    } catch (error) {
      console.error("Erro ao buscar dados anuais:", error);
    }
  };

  // Função para buscar gastos por mês específico do ano
  const buscarGastosPorMesAno = async (mes: string, ano: number) => {
    const usuarioId = localStorage.getItem("userID");
    const contaId = localStorage.getItem("contaID");
    
    if (!usuarioId || !contaId) return;

    setIsLoadingGraficoAnual(true);
    try {
      const url = `https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas/${contaId}/transacoes/gastosPorAno?ano=${ano}`;
      console.log('Buscando gastos por mês/ano:', url);
      const response = await fetch(url);
      const data = await response.json();
      
      if (data?.status === "OK" && Array.isArray(data.objeto)) {
        console.log('Dados recebidos:', JSON.stringify(data.objeto, null, 2));
        
        // Encontrar os dados do mês selecionado
        const mesData = data.objeto.find((item: any) => {
          const dataObj = new Date(item.mes);
          const mesIndex = dataObj.getMonth(); // 0-11
          const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
          return mesesNomes[mesIndex] === mes;
        });
        
        if (mesData && mesData.gastosValores) {
          setGastosMesAnual(mesData.gastosValores);
          setMesSelecionadoAnual(mes);
          // Buscar também as transações individuais
          buscarTransacoesDoMes(mes, ano);
        } else {
          setGastosMesAnual([]);
          setMesSelecionadoAnual(mes);
          setTransacoesDoMes([]);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar gastos por mês/ano:", error);
    } finally {
      setIsLoadingGraficoAnual(false);
    }
  };

  // Função para buscar transações individuais do mês
  const buscarTransacoesDoMes = async (mes: string, ano: number) => {
    const usuarioId = localStorage.getItem("userID");
    const contaId = localStorage.getItem("contaID");
    
    if (!usuarioId || !contaId) return;

    setIsLoadingTransacoesDoMes(true);
    try {
      // Converter nome do mês para número (Jan = 01, Fev = 02, etc.)
      const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const mesNumero = String(mesesNomes.indexOf(mes) + 1).padStart(2, '0');
      
      const url = `https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas/${contaId}/transacoes/gastosPorMes?ano=${ano}&mes=${mesNumero}`;
      console.log('🔍 Buscando transações do mês:', mes, ano);
      console.log('📡 URL:', url);
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📦 Resposta da API:', data);
      
      if (data?.status === "OK" && Array.isArray(data.objeto)) {
        // Coletar todas as transações de todos os dias do mês
        const todasTransacoes: Array<{data: string; tipo: string; valor: number}> = [];
        
        data.objeto.forEach((dia: any) => {
          console.log('🗓️ Processando dia:', dia.data, '| Transações:', dia.transacoes?.length || 0);
          
          if (dia.transacoes && Array.isArray(dia.transacoes)) {
            dia.transacoes.forEach((transacao: any) => {
              todasTransacoes.push({
                data: transacao.data,
                tipo: transacao.tipo,
                valor: transacao.valor
              });
            });
          }
        });
        
        console.log('💰 Total de transações encontradas:', todasTransacoes.length);
        console.log('📋 Transações:', todasTransacoes);
        
        // Ordenar por data (mais recente primeiro)
        todasTransacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
        
        setTransacoesDoMes(todasTransacoes);
        console.log('✅ Transações definidas no estado!');
      } else {
        console.log('❌ Resposta inválida da API');
        setTransacoesDoMes([]);
      }
    } catch (error) {
      console.error("❌ Erro ao buscar transações do mês:", error);
      setTransacoesDoMes([]);
    } finally {
      setIsLoadingTransacoesDoMes(false);
    }
  };

  // Função unificada para buscar dados dos gráficos
  const buscarDadosGraficos = async (mesAnoSelecionado?: string) => {
    const usuarioId = localStorage.getItem("userID");
    const contaId = localStorage.getItem("contaID");
    
    if (!usuarioId || !contaId) return;

    try {
      const [ano, mes] = (mesAnoSelecionado || mesSelecionadoGrafico).split('-');
      
      // Buscar dados mensais
      const urlMensal = `https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas/${contaId}/transacoes/gastosPorMes?ano=${ano}&mes=${mes}`;
      console.log('Buscando dados dos gráficos:', urlMensal);
      const responseMensal = await fetch(urlMensal);
      const dataMensal = await responseMensal.json();
      
      if (dataMensal?.status === "OK" && Array.isArray(dataMensal.objeto)) {
        console.log('Dados recebidos:', JSON.stringify(dataMensal.objeto, null, 2));
        
        // Criar um array para armazenar os dados processados
        const dadosDiarios = dataMensal.objeto
          .sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime())
          .map((dia: any) => {
            // Inicializa o objeto do dia com a data
            console.log('Data original:', dia.data);
            const [ano, mes, dia_] = dia.data.split('-').map(Number);
            console.log('Data separada:', { ano, mes, dia_ });
            const diaGasto = String(dia_).padStart(2, '0');
            const mesReal = String(mes).padStart(2, '0');
            console.log('Data formatada:', `${diaGasto}/${mesReal}`);
            const dadoDia: any = {
              date: `${diaGasto}/${mesReal}`
            };

            // Agrupa transações por categoria
            const categorias: { [key: string]: number } = {};
            dia.transacoes?.forEach((transacao: any) => {
              const categoria = transacao.categoria || 'Outros';
              categorias[categoria] = (categorias[categoria] || 0) + transacao.valor;
            });

            // Adiciona os valores de cada categoria ao objeto do dia
            Object.entries(categorias).forEach(([categoria, valor]) => {
              dadoDia[categoria] = valor;
            });

            return dadoDia;
          });

        setGastosDiarios(dadosDiarios);
      } else {
        // Se não houver dados ou ocorrer erro, mostrar apenas o primeiro dia do mês selecionado
        const mes = (mesAnoSelecionado || mesSelecionadoGrafico).split('-')[1];
        console.log('Sem dados, usando mês selecionado:', `01/${mes}`);
        setGastosDiarios([{
          date: `01/${mes}`,
          value: 0
        }]);
      }

      // Buscar dados por categoria
      const urlCategorias = `https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas/${contaId}/transacoes/categorias-mais-usadas?ano=${ano}&mes=${mes}`;
      const responseCategorias = await fetch(urlCategorias);
      const dataCategorias = await responseCategorias.json();

      if (dataCategorias?.status === "OK" && Array.isArray(dataCategorias.objeto)) {
        // Mapa de cores específicas para cada categoria
        const categoryColors: { [key: string]: string } = {
          'Alimentação': '#FF6B6B',
          'Transporte': '#4CAF50',
          'Moradia': '#2196F3',
          'Contas e Serviços': '#9C27B0',
          'Saúde': '#00BCD4',
          'Educação': '#3F51B5',
          'Lazer': '#FF9800',
          'Vestuário': '#E91E63',
          'Beleza e Cuidados Pessoais': '#F06292',
          'Tecnologia': '#607D8B',
          'Assinaturas e Streaming': '#8E24AA',
          'Pets': '#FFA726',
          'Doações e Presentes': '#FFD93D',
          'Transferência Pessoal': '#90A4AE',
          'Serviços': '#26A69A',
          'Impostos e Taxas': '#78909C',
          'Viagens': '#29B6F6',
          'Investimentos': '#66BB6A',
          'Emergências': '#EF5350',
          'Outros': '#BDBDBD'
        };

        const dadosCategorias = dataCategorias.objeto.map((cat: any) => ({
          name: cat.categoria || 'Outros',
          value: cat.valor || 0,
          color: categoryColors[cat.categoria] || categoryColors['Outros']
        }));

        setGastosPorCategoria(dadosCategorias);
      }
    } catch (error) {
      console.error("Erro ao buscar dados dos gráficos:", error);
    } finally {
      setIsLoadingGastos(false);
    }
  };

  const fetchGastoMensal = async () => {
    const usuarioId = localStorage.getItem("userID");
    const contaId = localStorage.getItem("contaID");
    
    console.log('Iniciando fetchGastoMensal:', { usuarioId, contaId });
    
    if (usuarioId && contaId) {
      try {
        // Obtém a data atual do dispositivo e formata corretamente
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0'); // Garante 2 dígitos

        // Monta a URL com os parâmetros formatados
        const url = `https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas/${contaId}/transacoes/resumoGastoDaContaPorMes?ano=${ano}&mes=${mes}`;
        console.log('Buscando gastos do mes:', { ano, mes, url });
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.status === "OK" && Array.isArray(data.objeto)) {
            // Inicializa os valores com 0
            let totalPix = 0;
            let totalDebito = 0;
            let totalBoleto = 0;
            let totalTransferencia = 0;

            console.log('Processando dados recebidos:', data.objeto);
            
            // Processa cada tipo de gasto
            data.objeto.forEach((gasto: { tipoGasto: string; totalGasto: number }) => {
              console.log('Processando gasto:', gasto);
              switch (gasto.tipoGasto) {
                case 'PIX':
                  totalPix = gasto.totalGasto;
                  console.log('Definindo PIX:', { totalPix });
                  break;
                case 'PAGAMENTO_DEBITO':
                  totalDebito = gasto.totalGasto;
                  console.log('Definindo Débito:', { totalDebito });
                  break;
                case 'PAGAMENTO_BOLETO':
                  totalBoleto = gasto.totalGasto;
                  console.log('Definindo Boleto:', { totalBoleto });
                  break;
                case 'TRANSFERENCIA_INTERNA':
                case 'TRANSFERENCIA_EXTERNA':
                  totalTransferencia = gasto.totalGasto;
                  console.log('Definindo Transferência:', { totalTransferencia });
                  break;
              }
            });

            console.log('Gastos mensais calculados:', { totalPix, totalDebito, totalBoleto, totalTransferencia });

            const gastosMensais = {
              pix: Number(totalPix),
              debito: Number(totalDebito),
              boleto: Number(totalBoleto),
              transferencia: Number(totalTransferencia)
            };

            console.log('Atualizando gastos mensais:', gastosMensais);

            // Atualiza os estados
            setGastosPorTipoMensal(gastosMensais);
          }
        } else {
          console.error("Erro ao buscar gastos do mes:", response.status);
        }
      } catch (error) {
        console.error("Erro ao buscar gasto do mes:", error);
      }
    }
  };

  const fetchGastoHoje = async () => {
    const usuarioId = localStorage.getItem("userID");
    const contaId = localStorage.getItem("contaID");
    
    if (usuarioId && contaId) {
      try {
        // Obtém a data atual do dispositivo e formata corretamente
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0'); // Garante 2 dígitos
        const dia = String(hoje.getDate()).padStart(2, '0'); // Garante 2 dígitos

        // Monta a URL com os parâmetros formatados
        const url = `https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas/${contaId}//transacoes/resumoGastoDaContaPorDia?ano=${ano}&mes=${mes}&dia=${dia}`;
        console.log('Buscando gastos do dia:', { ano, mes, dia, url });
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.status === "OK" && Array.isArray(data.objeto)) {
            // Inicializa os valores com 0
            let totalPix = 0;
            let totalDebito = 0;
            let totalBoleto = 0;
            let totalTransferencia = 0;
            let gastoTotal = 0;

            // Processa cada tipo de gasto
            data.objeto.forEach((gasto: { tipoGasto: string; totalGasto: number }) => {
              switch (gasto.tipoGasto) {
                case 'PIX':
                  totalPix = gasto.totalGasto;
                  break;
                case 'PAGAMENTO_DEBITO':
                  totalDebito = gasto.totalGasto;
                  break;
                case 'PAGAMENTO_BOLETO':
                  totalBoleto = gasto.totalGasto;
                  break;
                case 'TRANSFERENCIA_INTERNA':
                  totalTransferencia += gasto.totalGasto;
                  break;
                case 'TRANSFERENCIA_EXTERNA':
                  totalTransferencia += gasto.totalGasto;
                  break;
              }
              gastoTotal += gasto.totalGasto;
            });

            // Atualiza os estados
            setGastosPorTipo({
              pix: totalPix,
              debito: totalDebito,
              boleto: totalBoleto,
              transferencia: totalTransferencia
            });
            setGastoHoje(gastoTotal);
          }
        } else {
          console.error("Erro ao buscar gastos do dia:", response.status);
        }
      } catch (error) {
        console.error("Erro ao buscar gasto do dia:", error);
      }
    }
  };

  // Função para buscar as categorias mais usadas do mês anterior
  const fetchCategoriaMaisUsada = async () => {
    const usuarioId = localStorage.getItem("userID");
    const contaId = localStorage.getItem("contaID");
    
    setIsLoadingReport(true);
    if (usuarioId && contaId) {
      try {
        // Obtém a data do mês anterior
        const hoje = new Date();
        const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1);
        const ano = mesAnterior.getFullYear();
        const mes = String(mesAnterior.getMonth() + 1).padStart(2, '0');

        const url = `https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas/${contaId}/transacoes/categorias-mais-usadas?ano=${ano}&mes=${mes}`;
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.status === "OK" && Array.isArray(data.objeto) && data.objeto.length > 0) {
            setMaiorGastoMesAnterior(data.objeto[0]); // Pega a primeira categoria (maior gasto)
          }
        }
      } catch (error) {
        console.error("Erro ao buscar categorias mais usadas:", error);
      } finally {
        setIsLoadingReport(false);
      }
    } else {
      setIsLoadingReport(false);
    }
  };

  // Escutar mudanças no localStorage para atualizar o avatar em tempo real
  // Effect para buscar dados dos gráficos quando a seção ou mês selecionado mudar
  useEffect(() => {
    if (activeSection === 'graficos') {
      buscarDadosGraficos(mesSelecionadoGrafico);
      // Buscar meses disponíveis quando entrar na seção de gráficos
      if (mesesDisponiveis.length === 0) {
        fetchMesesDisponiveis();
      }
    }
  }, [activeSection, mesSelecionadoGrafico]);

  // Effect para recarregar dados quando voltar para a seção de controle
  useEffect(() => {
    if (activeSection === 'controle') {
      const recarregarDadosControle = async () => {
        await Promise.all([
          fetchGastoHoje(),
          fetchGastoMensal(),
          fetchCategoriaMaisUsada()
        ]);
      };
      recarregarDadosControle();
    }
  }, [activeSection]);

  // Effect para fechar o dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSelectOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-select-dropdown]')) {
          setIsSelectOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSelectOpen]);

  useEffect(() => {
    const usuarioId = localStorage.getItem("userID");

    if (usuarioId) {
      // Função assíncrona para aguardar todas as chamadas
      const carregarDados = async () => {
        setIsLoadingGastos(true);
        
        // Aguarda todas as chamadas de gastos em paralelo
        await Promise.all([
          fetchGastoHoje(),
          fetchGastoMensal(),
          fetchCategoriaMaisUsada()
        ]);
        
        setIsLoadingGastos(false);
      };

      // Executa o carregamento de gastos
      carregarDados();
      
      setIsLoadingSaldo(true);
      fetch(`https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas`)
        .then(res => {
          if (!res.ok) {
            throw new Error("Erro ao buscar contas");
          }
          return res.json();
        })
        .then(data => {
          if (data && data.objeto && data.objeto.length > 0) {
            // pega a ÚLTIMA conta do array
            const ultimaConta = data.objeto[data.objeto.length - 1];
            setSaldo(ultimaConta.saldo);
            setNumeroConta(ultimaConta.numero || ultimaConta.id); // Busca o número da conta ou usa o ID como fallback
            localStorage.setItem("contaID", ultimaConta.id);
            
            const handleStorageChange = (e: StorageEvent) => {
              if (e.key === 'userAvatar') {
                setUserAvatar(e.newValue);
              }
            };
            window.addEventListener('storage', handleStorageChange);
            return () => window.removeEventListener('storage', handleStorageChange);
          }
        })
        .catch(err => {
          console.error("Erro ao buscar saldo:", err);
        })
        .finally(() => {
          setIsLoadingSaldo(false);
        });
    }
  }, []);

  // Effect para buscar anos disponíveis quando entrar na seção de gráficos
  useEffect(() => {
    if (activeSection === 'graficos' && anosDisponiveis.length === 0) {
      fetchAnosDisponiveis();
    }
  }, [activeSection]);

  // Effect para buscar dados anuais quando o ano selecionado mudar
  useEffect(() => {
    if (activeSection === 'graficos' && anoSelecionadoGrafico) {
      buscarDadosAnuais(anoSelecionadoGrafico);
    }
  }, [anoSelecionadoGrafico, activeSection]);

  // Effect para monitorar o scroll do gráfico anual
  useEffect(() => {
    const graficoElement = graficoAnualRef.current;
    if (!graficoElement) return;

    const handleScroll = () => {
      checkScrollPositionAnual();
    };

    graficoElement.addEventListener('scroll', handleScroll);
    
    // Verificar posição inicial
    checkScrollPositionAnual();

    return () => {
      graficoElement.removeEventListener('scroll', handleScroll);
    };
  }, [gastosMensais]);

  // Effect para rolar automaticamente para o mês atual
  useEffect(() => {
    if (gastosMensais.length > 0 && graficoAnualRef.current) {
      const mesAtual = new Date().getMonth(); // 0-11
      // Cada barra tem aproximadamente 150px (80px largura + espaçamentos)
      // Subtrai 150px para mostrar também o mês anterior
      const scrollPosition = Math.max(0, (mesAtual - 1) * 150);
      
      // Pequeno delay para garantir que o gráfico foi renderizado
      setTimeout(() => {
        if (graficoAnualRef.current) {
          graficoAnualRef.current.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
          });
          // Atualizar estado das setas após o scroll
          setTimeout(checkScrollPositionAnual, 350);
        }
      }, 300);
    }
  }, [gastosMensais]);

  // Effect para fechar o dropdown de anos quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isAnoSelectOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-ano-select-dropdown]')) {
          setIsAnoSelectOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAnoSelectOpen]);

  const handleProfileClick = () => {
    navigate("/perfil");
  };

  const handleVerExtratoClick = () => {
    navigate("/extrato");
  };

  const handleControleGastoClick = () => {
    setActiveSection('controle');
  };

  const handleGraficosClick = () => {
    setActiveSection('graficos');
  };

  const handleRelatoriosClick = () => {
    setActiveSection('relatorios');
  };

  // Funções para arrastar o gráfico anual
  const handleMouseDownAnual = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!graficoAnualRef.current) return;
    setIsDraggingAnual(true);
    setStartXAnual(e.pageX - graficoAnualRef.current.offsetLeft);
    setScrollLeftAnual(graficoAnualRef.current.scrollLeft);
    graficoAnualRef.current.style.cursor = 'grabbing';
  };

  const handleMouseLeaveAnual = () => {
    if (!graficoAnualRef.current) return;
    setIsDraggingAnual(false);
    graficoAnualRef.current.style.cursor = 'grab';
  };

  const handleMouseUpAnual = () => {
    if (!graficoAnualRef.current) return;
    setIsDraggingAnual(false);
    graficoAnualRef.current.style.cursor = 'grab';
  };

  const handleMouseMoveAnual = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingAnual || !graficoAnualRef.current) return;
    e.preventDefault();
    const x = e.pageX - graficoAnualRef.current.offsetLeft;
    const walk = (x - startXAnual) * 2; // Multiplica por 2 para scroll mais rápido
    graficoAnualRef.current.scrollLeft = scrollLeftAnual - walk;
    checkScrollPositionAnual();
  };

  // Função para verificar a posição do scroll e atualizar estado das setas
  const checkScrollPositionAnual = () => {
    if (!graficoAnualRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = graficoAnualRef.current;
    
    // Pode rolar para esquerda se não estiver no início
    setCanScrollLeftAnual(scrollLeft > 5);
    
    // Pode rolar para direita se não estiver no fim
    setCanScrollRightAnual(scrollLeft < scrollWidth - clientWidth - 5);
  };

  // Função para rolar o gráfico para a esquerda
  const scrollLeftGraficoAnual = () => {
    if (graficoAnualRef.current) {
      graficoAnualRef.current.scrollBy({ left: -300, behavior: 'smooth' });
      setTimeout(checkScrollPositionAnual, 350);
    }
  };

  // Função para rolar o gráfico para a direita
  const scrollRightGraficoAnual = () => {
    if (graficoAnualRef.current) {
      graficoAnualRef.current.scrollBy({ left: 300, behavior: 'smooth' });
      setTimeout(checkScrollPositionAnual, 350);
    }
  };


  // Função para renderizar o conteúdo dinâmico do card branco
  const renderActiveContent = () => {
    switch (activeSection) {
      case 'controle':
        return (
          <>
              {/* Card Relatório gerado pela agi.ia */}
            <div style={{
              width: '100%',
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxSizing: 'border-box',
              marginBottom: '16px'
            }}>
              {/* Título */}
              <div style={{
                color: '#0065F5',
                fontSize: '18px',
                fontWeight: '700',
                textAlign: 'left'
              }}>
                Relatório gerado pela agi.ia
              </div>
              
              {/* Texto do relatório */}
              <div style={{
                color: '#000000',
                fontSize: '16px',
                fontWeight: '400',
                lineHeight: '1.5',
                textAlign: 'left'
              }}>
                {isLoadingReport ? (
                  // Skeleton loading
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{
                      height: '20px',
                      width: '90%',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '4px',
                      animation: 'pulse 1.5s infinite'
                    }}></div>
                    <div style={{
                      height: '20px',
                      width: '75%',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '4px',
                      animation: 'pulse 1.5s infinite'
                    }}></div>
                    <div style={{
                      height: '20px',
                      width: '85%',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '4px',
                      animation: 'pulse 1.5s infinite'
                    }}></div>
                    <style>
                      {`
                        @keyframes pulse {
                          0% { opacity: 1; }
                          50% { opacity: 0.5; }
                          100% { opacity: 1; }
                        }
                      `}
                    </style>
                  </div>
                ) : maiorGastoMesAnterior ? (
                  <>
                    No mês passado, sua maior despesa foi em{' '}
                    <span style={{ color: '#0065F5', fontWeight: '600', fontStyle: 'italic' }}>
                      {maiorGastoMesAnterior.categoria}
                    </span>
                    , totalizando{' '}
                    <span style={{ color: '#0065F5', fontWeight: '600' }}>
                      R$ {maiorGastoMesAnterior.valor.toFixed(2).replace('.', ',')}
                    </span>
. {(() => {
                      switch (maiorGastoMesAnterior.categoria) {
                        case 'Alimentação':
                          return 'Que tal começar a preparar mais refeições em casa? Você pode economizar até 70% do valor gasto com alimentação fora. Faça uma lista de compras e planeje suas refeições da semana!';
                        case 'Transporte':
                          return 'Considere alternativas como carona compartilhada, transporte público ou até mesmo uma bike para trajetos curtos. Além de economizar, você contribui com o meio ambiente!';
                        case 'Moradia':
                          return 'Revise seus gastos com moradia. Pequenas mudanças como trocar lâmpadas por LED e controlar o uso do ar condicionado podem gerar economia significativa nas contas.';
                        case 'Contas e Serviços':
                          return 'Compare preços entre fornecedores e avalie se todos os serviços contratados são realmente necessários. Às vezes, planos mais básicos podem atender suas necessidades.';
                        case 'Saúde':
                          return 'Invista em prevenção! Mantenha checkups regulares e considere um plano de saúde que melhor atenda suas necessidades. Práticas saudáveis reduzem gastos futuros.';
                        case 'Educação':
                          return 'Educação é investimento! Mas pesquise por alternativas como cursos online, bolsas de estudo ou programas de desconto. Conhecimento não precisa custar tanto.';
                        case 'Lazer':
                          return 'Procure alternativas gratuitas ou mais econômicas de lazer. Parques, eventos culturais gratuitos e promoções podem ser ótimas opções de diversão!';
                        case 'Vestuário':
                          return 'Que tal criar um guarda-roupa cápsula? Invista em peças versáteis e de qualidade. Aproveite liquidações e outlets para compras planejadas.';
                        case 'Beleza e Cuidados Pessoais':
                          return 'Pesquise por produtos similares mais econômicos e aproveite promoções para estocar itens essenciais. Considere aprender técnicas de cuidados caseiros.';
                        case 'Tecnologia':
                          return 'Faça uma lista de prioridades tecnológicas. Compare preços, espere por promoções e avalie se realmente precisa das últimas versões dos produtos.';
                        case 'Assinaturas e Streaming':
                          return 'Revise suas assinaturas! Compartilhe contas com família/amigos quando possível e cancele serviços pouco utilizados. Considere planos família para economia.';
                        case 'Pets':
                          return 'Compare preços de rações e produtos pet em diferentes lojas. Pesquise planos de saúde pet e promoções em pet shops de confiança.';
                        case 'Doações e Presentes':
                          return 'Presentes não precisam ser caros para ser especiais. Considere presentes feitos à mão ou experiências compartilhadas em vez de bens materiais.';
                        case 'Transferência Pessoal':
                          return 'Monitore suas transferências pessoais. Estabeleça um limite mensal e mantenha um registro claro dessas movimentações.';
                        case 'Serviços':
                          return 'Pesquise e compare preços de diferentes prestadores. Às vezes, negociar pacotes de serviços pode trazer bons descontos.';
                        case 'Impostos e Taxas':
                          return 'Fique atento aos prazos de pagamento. Pagamentos em dia evitam multas e juros. Consulte um contador para orientações sobre deduções possíveis.';
                        case 'Viagens':
                          return 'Planeje viagens com antecedência! Utilize ferramentas de comparação de preços e programe-se para viajar na baixa temporada.';
                        case 'Investimentos':
                          return 'Ótimo ver que você está investindo! Continue estudando sobre educação financeira e diversifique seus investimentos de acordo com seus objetivos.';
                        case 'Emergências':
                          return 'Crie um fundo de emergência para evitar gastos não planejados. Recomenda-se guardar de 3 a 6 vezes suas despesas mensais.';
                        case 'Outros':
                          return 'Categorize melhor seus gastos para um controle mais eficiente. Quanto mais específico o controle, mais fácil identificar onde economizar!';
                        default:
                          return 'Analise seus gastos e identifique oportunidades de economia. Pequenas mudanças podem fazer grande diferença no fim do mês!';
                      }
                    })()}
                  </>
                ) : (
                  <>
                    Bem-vindo(a) ao seu assistente financeiro pessoal! 🎉{' '}
                    <span style={{ color: '#0065F5', fontWeight: '600' }}>
                      Comece sua jornada de educação financeira
                    </span>
                    {' '}registrando suas despesas diárias. A partir do próximo mês, você receberá análises personalizadas dos seus gastos e dicas para economizar. Dica inicial: anote todos os seus gastos, mesmo os pequenos - eles fazem a diferença no fim do mês!
                  </>
                )}
              </div>
            </div>
            
            {/* Total de Transações */}
            <div style={{
              color: '#1e293b',
              fontSize: '16px',
              fontWeight: '400',
              marginBottom: '8px'
            }}>

            </div>
            
            {/* Título Controle de gasto */}
            <div style={{
              color: '#1e293b',
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '12px'
            }}>
              Controle de gasto
            </div>

            {/* Lista de Cards de Controle */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>

              

              {/* Card Gastos Total */}
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
                justifyContent: 'space-between',
                gap: '16px',
                position: 'relative'
              }}>
                {/* Container esquerdo: Ícone e Textos */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  {/* Ícone da seta para baixo */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ffffffff',
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
                      stroke="#000000ff" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M12 5v14"/>
                      <path d="m19 12-7 7-7-7"/>
                    </svg>
                  </div>
                  
                  {/* Textos e valor */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'center'
                  }}>
                    {/* Texto "Gastos Mensal" */}
                    <div style={{
                      color: '#64748b',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '4px'
                    }}>
                      Gasto Mensal
                    </div>
                    
                    {/* Valor dos gastos */}
                    <div style={{
                      color: '#000000ff',
                      fontSize: '20px',
                      fontWeight: '700'
                    }}>
                      {isLoadingGastos ? (
                        <ValueSkeleton width="120px" />
                      ) : (
                        `R$ ${(
                          gastosPorTipoMensal.pix + 
                          gastosPorTipoMensal.debito + 
                          gastosPorTipoMensal.boleto + 
                          gastosPorTipoMensal.transferencia
                        ).toFixed(2).replace('.', ',')}`
                      )}
                    </div>
                  </div>
                </div>

                {/* Mês no canto superior direito */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '20px',
                  color: '#94a3b8',
                  fontSize: '13px',
                  fontWeight: '600'
                }}>
                  {(() => {
                    const hoje = new Date();
                    const mesNome = hoje.toLocaleDateString('pt-BR', { month: 'long' });
                    return mesNome.charAt(0).toUpperCase() + mesNome.slice(1);
                  })()}
                </div>
              </div>

              {/* Card Resumo de gastos 2 */}
              <div style={{
                width: '100%',
                height: '170px',
                backgroundColor: 'white',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                boxSizing: 'border-box'
              }}>
                {/* Título */}
                <div style={{
                  color: '#0065F5',
                  fontSize: '16px',
                  fontWeight: '900',
                  marginBottom: '8px'
                }}>
                  Resumo de gastos do mês atual
                </div>

                {/* Linhas de informação */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  flex: 1
                }}>
                  {/* Pix */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '2px',
                        backgroundColor: '#000000',
                        flexShrink: 0
                      }}></div>
                      <span style={{
                        color: '#000000',
                        fontSize: '16px',
                        fontWeight: '600',
                        lineHeight: '1'
                      }}>
                        PIX
                      </span>
                    </div>
                    <span style={{
                      color: '#0065F5',
                      fontSize: '16px',
                      fontWeight: '700',
                      lineHeight: '1'
                    }}>
                      {isLoadingGastos ? (
                        <ValueSkeleton width="80px" />
                      ) : (
                        `R$ ${gastosPorTipoMensal.pix.toFixed(2).replace('.', ',')}`
                      )}
                    </span>
                  </div>

                  {/* Débito */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '2px',
                        backgroundColor: '#000000',
                        flexShrink: 0
                      }}></div>
                      <span style={{
                        color: '#000000',
                        fontSize: '16px',
                        fontWeight: '600',
                        lineHeight: '1'
                      }}>
                        Débito
                      </span>
                    </div>
                    <span style={{
                      color: '#0065F5',
                      fontSize: '16px',
                      fontWeight: '700',
                      lineHeight: '1'
                    }}>
                      {isLoadingGastos ? (
                        <ValueSkeleton width="80px" />
                      ) : (
                        `R$ ${gastosPorTipoMensal.debito.toFixed(2).replace('.', ',')}`
                      )}
                    </span>
                  </div>

                  {/* Boleto */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '2px',
                        backgroundColor: '#000000',
                        flexShrink: 0
                      }}></div>
                      <span style={{
                        color: '#000000',
                        fontSize: '16px',
                        fontWeight: '600',
                        lineHeight: '1'
                      }}>
                        Boleto
                      </span>
                    </div>
                    <span style={{
                      color: '#0065F5',
                      fontSize: '16px',
                      fontWeight: '700',
                      lineHeight: '1'
                    }}>
                      {isLoadingGastos ? (
                        <ValueSkeleton width="80px" />
                      ) : (
                        `R$ ${gastosPorTipoMensal.boleto.toFixed(2).replace('.', ',')}`
                      )}
                    </span>
                  </div>

                  {/* TED */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '2px',
                        backgroundColor: '#000000',
                        flexShrink: 0
                      }}></div>
                      <span style={{
                        color: '#000000',
                        fontSize: '16px',
                        fontWeight: '600',
                        lineHeight: '1'
                      }}>
                        TED
                      </span>
                    </div>
                    <span style={{
                      color: '#0065F5',
                      fontSize: '16px',
                      fontWeight: '700',
                      lineHeight: '1'
                    }}>
                      {isLoadingGastos ? (
                        <ValueSkeleton width="80px" />
                      ) : (
                        `R$ ${gastosPorTipoMensal.transferencia.toFixed(2).replace('.', ',')}`
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Resumo de gastos */}
              <div style={{
                width: '100%',
                height: '200px',
                backgroundColor: 'white',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                boxSizing: 'border-box'
              }}>
                {/* Título */}
                <div style={{
                  color: '#0065F5',
                  fontSize: '16px',
                  fontWeight: '900',
                  marginBottom: '8px'
                }}>
                  Resumo de gastos de hoje
                </div>
                
                {/* Linhas de informação */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  flex: 1
                }}>
                  {/* PIX */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '2px',
                        backgroundColor: '#000000',
                        flexShrink: 0
                      }}></div>
                      <span style={{
                        color: '#000000',
                        fontSize: '16px',
                        fontWeight: '600',
                        lineHeight: '1'
                      }}>
                        PIX
                      </span>
                    </div>
                    <span style={{
                      color: '#0065F5',
                      fontSize: '16px',
                      fontWeight: '700',
                      lineHeight: '1'
                    }}>
                      {isLoadingGastos ? (
                        <ValueSkeleton width="80px" />
                      ) : (
                        `R$ ${gastosPorTipo.pix.toFixed(2).replace('.', ',')}`
                      )}
                    </span>
                  </div>

                  {/* Débito */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '2px',
                        backgroundColor: '#000000',
                        flexShrink: 0
                      }}></div>
                      <span style={{
                        color: '#000000',
                        fontSize: '16px',
                        fontWeight: '600',
                        lineHeight: '1'
                      }}>
                        Débito
                      </span>
                    </div>
                    <span style={{
                      color: '#0065F5',
                      fontSize: '16px',
                      fontWeight: '700',
                      lineHeight: '1'
                    }}>
                      {isLoadingGastos ? (
                        <ValueSkeleton width="80px" />
                      ) : (
                        `R$ ${gastosPorTipo.debito.toFixed(2).replace('.', ',')}`
                      )}
                    </span>
                  </div>

                  {/* Boleto */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '2px',
                        backgroundColor: '#000000',
                        flexShrink: 0
                      }}></div>
                      <span style={{
                        color: '#000000',
                        fontSize: '16px',
                        fontWeight: '600',
                        lineHeight: '1'
                      }}>
                        Boleto
                      </span>
                    </div>
                    <span style={{
                      color: '#0065F5',
                      fontSize: '16px',
                      fontWeight: '700',
                      lineHeight: '1'
                    }}>
                      {isLoadingGastos ? (
                        <ValueSkeleton width="80px" />
                      ) : (
                        `R$ ${gastosPorTipo.boleto.toFixed(2).replace('.', ',')}`
                      )}
                    </span>
                  </div>

                  {/* TED */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '2px',
                        backgroundColor: '#000000',
                        flexShrink: 0
                      }}></div>
                      <span style={{
                        color: '#000000',
                        fontSize: '16px',
                        fontWeight: '600',
                        lineHeight: '1'
                      }}>
                        TED
                      </span>
                    </div>
                    <span style={{
                      color: '#0065F5',
                      fontSize: '16px',
                      fontWeight: '700',
                      lineHeight: '1'
                    }}>
                      {isLoadingGastos ? (
                        <ValueSkeleton width="80px" />
                      ) : (
                        `R$ ${gastosPorTipo.transferencia.toFixed(2).replace('.', ',')}`
                      )}
                    </span>
                  </div>

                  {/* Gasto hoje */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '20px',
                    marginTop: '5px'
                  }}>
                    <span style={{
                      color: '#000000',
                      fontSize: '16px',
                      fontWeight: '600',
                      lineHeight: '1'
                    }}>
                      Gasto de hoje
                    </span>
                    <span style={{
                      color: '#000000',
                      fontSize: '16px',
                      fontWeight: '700',
                      lineHeight: '1'
                    }}>
                      {isLoadingGastos ? (
                        <ValueSkeleton width="80px" />
                      ) : (
                        `R$ ${gastoHoje.toFixed(2).replace('.', ',')}`
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      case 'graficos':
        return (
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            padding: '16px'
          }}>
            {/* Gráfico de Linha - Gastos Diários */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              minHeight: '700px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <h3 style={{ color: '#0065F5', fontSize: '18px', fontWeight: '600', marginBottom: '8px', textAlign: 'center' }}>
                  Gastos Diários do Mês
                </h3>
              {/* Banner informativo - Gráfico clicável */}
              <div style={{
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                maxWidth: '600px',
                animation: 'slideIn 0.5s ease-out'
              }}>
                <svg 
                  style={{ width: '20px', height: '20px', flexShrink: 0 }} 
                  fill="#3B82F6" 
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <span style={{ 
                  color: '#1E40AF', 
                  fontSize: '13px',
                  fontWeight: '500',
                  lineHeight: '1.4'
                }}>
                  <strong>Dica: </strong>Clique nas barras do gráfico para ver um relatório detalhado das transações!
                </span>
              </div>
              {/* Novo banner - Interação com legenda */}
              <div style={{
                padding: '5px 16px',
                marginBottom: '0px',
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                animation: 'slideIn 0.5s ease-out'
              }}>
                <span style={{ 
                  fontSize: '13.5px',
                  textAlign:'center',
                  fontWeight: '500',
                  lineHeight: '1.1',
                  color: '#1e293b'
                }}>
                  Clique no texto da categoria para ocultar/mostrar no gráfico!
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                alignItems: 'center', 
                width: '100%', 
                marginBottom: '8px',
                position: 'relative'
              }}>
                {/* Select customizado */}
                <div style={{ position: 'relative', minWidth: '200px' }} data-select-dropdown>
                  <button
                    onClick={() => setIsSelectOpen(!isSelectOpen)}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: 'white',
                      color: '#1e293b',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#0065F5';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 101, 245, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    <span>
                      {(() => {
                        const [ano, mes] = mesSelecionadoGrafico.split('-');
                        const data = new Date(Number(ano), Number(mes) - 1);
                        const monthName = data.toLocaleString('pt-BR', { month: 'long' });
                        return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${ano}`;
                      })()}
                    </span>
                    <svg 
                      style={{ 
                        width: '16px', 
                        height: '16px',
                        transition: 'transform 0.2s ease',
                        transform: isSelectOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                      }} 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M7 10l5 5 5-5z"/>
                    </svg>
                  </button>
                  
                  {/* Dropdown menu */}
                  {isSelectOpen && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      right: 0,
                      minWidth: '200px',
                      maxHeight: '300px',
                      overflowY: 'auto',
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                      zIndex: 1000,
                      animation: 'slideIn 0.2s ease-out',
                      padding: '4px 0'
                    }}>
                      {mesesDisponiveis.length > 0 ? (
                        mesesDisponiveis.map(mesAno => {
                          const [ano, mes] = mesAno.split('-');
                          const data = new Date(Number(ano), Number(mes) - 1);
                          const monthName = data.toLocaleString('pt-BR', { month: 'long' });
                          const displayText = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${ano}`;
                          const isSelected = mesAno === mesSelecionadoGrafico;
                          
                          return (
                            <button
                              key={mesAno}
                              onClick={() => {
                                setMesSelecionadoGrafico(mesAno);
                                buscarDadosGraficos(mesAno);
                                setIsSelectOpen(false);
                              }}
                              style={{
                                width: '100%',
                                padding: '10px 16px',
                                margin: 0,
                                border: 'none',
                                backgroundColor: isSelected ? '#EFF6FF' : 'white',
                                color: isSelected ? '#0065F5' : '#1e293b',
                                fontSize: '14px',
                                fontWeight: isSelected ? '600' : '400',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.15s ease',
                                borderBottom: 'none',
                                display: 'block'
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.backgroundColor = '#f8fafc';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.backgroundColor = 'white';
                                }
                              }}
                            >
                              {displayText}
                              {isSelected && (
                                <span style={{ float: 'right', color: '#0065F5' }}>✓</span>
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div style={{
                          padding: '12px 16px',
                          color: '#64748b',
                          fontSize: '14px',
                          textAlign: 'center'
                        }}>
                          Carregando meses...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {gastosDiarios.length > 0 ? (
                <div style={{ height: '600px', width: '100%', cursor: 'pointer' }}>
                  <Bar
                    data={{
                      labels: gastosDiarios.map(dia => dia.date),
                      datasets: [
                        { label: 'Alimentação', backgroundColor: '#FF6B6B', data: gastosDiarios.map(dia => dia['Alimentação'] || 0), stack: 'Stack 0' },
                        { label: 'Transporte', backgroundColor: '#4CAF50', data: gastosDiarios.map(dia => dia['Transporte'] || 0), stack: 'Stack 0' },
                        { label: 'Moradia', backgroundColor: '#2196F3', data: gastosDiarios.map(dia => dia['Moradia'] || 0), stack: 'Stack 0' },
                        { label: 'Contas e Serviços', backgroundColor: '#9C27B0', data: gastosDiarios.map(dia => dia['Contas e Serviços'] || 0), stack: 'Stack 0' },
                        { label: 'Saúde', backgroundColor: '#00BCD4', data: gastosDiarios.map(dia => dia['Saúde'] || 0), stack: 'Stack 0' },
                        { label: 'Educação', backgroundColor: '#3F51B5', data: gastosDiarios.map(dia => dia['Educação'] || 0), stack: 'Stack 0' },
                        { label: 'Lazer', backgroundColor: '#FF9800', data: gastosDiarios.map(dia => dia['Lazer'] || 0), stack: 'Stack 0' },
                        { label: 'Vestuário', backgroundColor: '#E91E63', data: gastosDiarios.map(dia => dia['Vestuário'] || 0), stack: 'Stack 0' },
                        { label: 'Beleza e Cuidados Pessoais', backgroundColor: '#F06292', data: gastosDiarios.map(dia => dia['Beleza e Cuidados Pessoais'] || 0), stack: 'Stack 0' },
                        { label: 'Tecnologia', backgroundColor: '#607D8B', data: gastosDiarios.map(dia => dia['Tecnologia'] || 0), stack: 'Stack 0' },
                        { label: 'Assinaturas e Streaming', backgroundColor: '#8E24AA', data: gastosDiarios.map(dia => dia['Assinaturas e Streaming'] || 0), stack: 'Stack 0' },
                        { label: 'Pets', backgroundColor: '#FFA726', data: gastosDiarios.map(dia => dia['Pets'] || 0), stack: 'Stack 0' },
                        { label: 'Doações e Presentes', backgroundColor: '#FFD93D', data: gastosDiarios.map(dia => dia['Doações e Presentes'] || 0), stack: 'Stack 0' },
                        { label: 'Outros', backgroundColor: '#BDBDBD', data: gastosDiarios.map(dia => dia['Outros'] || 0), stack: 'Stack 0' },
                        { label: 'Transferência Pessoal', backgroundColor: '#90A4AE', data: gastosDiarios.map(dia => dia['Transferência Pessoal'] || 0), stack: 'Stack 0' },
                        { label: 'Serviços', backgroundColor: '#26A69A', data: gastosDiarios.map(dia => dia['Serviços'] || 0), stack: 'Stack 0' },
                        { label: 'Impostos e Taxas', backgroundColor: '#78909C', data: gastosDiarios.map(dia => dia['Impostos e Taxas'] || 0), stack: 'Stack 0' },
                        { label: 'Viagens', backgroundColor: '#29B6F6', data: gastosDiarios.map(dia => dia['Viagens'] || 0), stack: 'Stack 0' },
                        { label: 'Investimentos', backgroundColor: '#66BB6A', data: gastosDiarios.map(dia => dia['Investimentos'] || 0), stack: 'Stack 0' },
                        { label: 'Emergências', backgroundColor: '#EF5350', data: gastosDiarios.map(dia => dia['Emergências'] || 0), stack: 'Stack 0' }
                        
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      onClick: (_event, elements) => {
                        if (elements.length > 0) {
                          const element = elements[0];
                          const categorias = [
                            'Alimentação', 'Transporte', 'Moradia', 'Contas e Serviços',
                            'Saúde', 'Educação', 'Lazer', 'Vestuário', 'Beleza e Cuidados Pessoais',
                            'Tecnologia', 'Assinaturas e Streaming', 'Pets', 'Doações e Presentes',
                            'Outros', 'Transferência Pessoal', 'Serviços', 'Impostos e Taxas',
                            'Viagens', 'Investimentos', 'Emergências'
                          ];
                          const datasetLabel = categorias[(element as any).datasetIndex];
                          const date = gastosDiarios[(element as any).index].date;
                          const [dia, mes] = date.split('/');
                          const ano = mesSelecionadoGrafico.split('-')[0];
                          
                          const usuarioId = localStorage.getItem("userID");
                          const contaId = localStorage.getItem("contaID");
                          
                          if (usuarioId && contaId) {
                            // Ativar loading
                            setIsLoadingTransacoes(true);
                            
                            // Construir a URL com os parâmetros
                            const url = `https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas/${contaId}/transacoes/por-dia?ano=${ano}&mes=${mes}&dia=${dia}&categoria=${encodeURIComponent(datasetLabel)}`;
                            
                            // Fazer a chamada à API
                            fetch(url)
                              .then(response => response.json())
                              .then((data: RespostaTransacoes) => {
                                if (data.status === "OK" && data.objeto.length > 0) {
                                  setTransacoesSelecionadas(data.objeto);
                                  setCategoriaSelecionada(datasetLabel);
                                  setOrigemSelecao('grafico-diario');
                                  // Resetar cards expandidos ao carregar novas transações
                                  setExpandedCards(new Set());
                                  setDetalhesTransacao({});
                                  setActiveSection('relatorios');
                                } else {
                                  setTransacoesSelecionadas([]);
                                  setCategoriaSelecionada(datasetLabel);
                                  setOrigemSelecao('grafico-diario');
                                  // Resetar cards expandidos ao carregar novas transações
                                  setExpandedCards(new Set());
                                  setDetalhesTransacao({});
                                  setActiveSection('relatorios');
                                }
                              })
                              .catch(error => {
                                console.error("Erro ao buscar transações:", error);
                                alert("Erro ao buscar as transações. Por favor, tente novamente.");
                              })
                              .finally(() => {
                                // Desativar loading
                                setIsLoadingTransacoes(false);
                              });
                          } else {
                            alert("Erro: Usuário ou conta não encontrados.");
                          }
                        }
                      },
                      scales: {
                        x: {
                          stacked: true,
                          grid: {
                            display: false
                          }
                        },
                        y: {
                          stacked: true,
                          beginAtZero: true,
                          grid: {
                            color: 'rgba(0,0,0,0.1)'
                          },
                          max: Math.max(...gastosDiarios.flatMap(dia => {
                            const total = Object.entries(dia)
                              .filter(([key]) => key !== 'date')
                              .reduce((sum, [_, value]) => sum + (Number(value) || 0), 0);
                            return total;
                          })) + 20,
                          ticks: {
                            callback: (value) => `R$ ${Number(value).toFixed(2).replace('.', ',')}`
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          display: true,
                          position: 'bottom' as const,
                          align: 'start',
                          labels: {
                            boxWidth: 12,
                            padding: 15,
                            font: {
                              size: 11
                            },
                            usePointStyle: false,
                            color: '#1e293b'
                          },
                          onHover: (event: any) => {
                            event.native.target.style.cursor = 'pointer';
                          },
                          onLeave: (event: any) => {
                            event.native.target.style.cursor = 'default';
                          }
                        },
                        tooltip: {
                          enabled: true,
                          backgroundColor: 'rgba(0, 0, 0, 0.9)',
                          titleColor: '#ffffff',
                          bodyColor: '#ffffff',
                          borderColor: '#FCD34D',
                          borderWidth: 2,
                          padding: 12,
                          displayColors: true,
                          boxPadding: 6,
                          titleFont: {
                            size: 14,
                            weight: 'bold'
                          },
                          bodyFont: {
                            size: 13
                          },
                          callbacks: {
                            title: (tooltipItems) => {
                              return tooltipItems[0].label;
                            },
                            label: (context) => {
                              const value = context.raw as number;
                              const categoria = context.dataset.label || '';
                              return `${categoria}: R$ ${value.toFixed(2).replace('.', ',')}`;
                            },
                            afterLabel: () => {
                              return 'Clique para ver detalhes';
                            }
                          }
                        }
                      },
                      interaction: {
                        mode: 'nearest' as const,
                        intersect: true,
                        axis: 'x'
                      },
                      animation: {
                        duration: 750,
                        easing: 'easeInOutQuart' as const
                      },
                      hover: {
                        mode: 'nearest' as const,
                        intersect: true
                      }
                    }}
                  />
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '300px',
                  color: '#64748b'
                }}>
                  Carregando dados...
                </div>
              )}
            </div>

            {/* Gráfico de Rosca - Gastos por Categoria */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <h3 style={{ marginBottom: '8px', color: '#0065F5', fontSize: '18px', fontWeight: '600' }}>
                Gastos por Categoria do Mês
              </h3>
              {/* Banner informativo - Gráfico clicável */}
              <div style={{
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                maxWidth: '600px',
                animation: 'slideIn 0.5s ease-out'
              }}>
                <svg 
                  style={{ width: '20px', height: '20px', flexShrink: 0 }} 
                  fill="#3B82F6" 
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <span style={{ 
                  color: '#1E40AF', 
                  fontSize: '13px',
                  fontWeight: '500',
                  lineHeight: '1.4'
                }}>
                  <strong>Dica: </strong>Clique no gráfico ou nas categorias abaixo para ver transações detalhadas!
                </span>
              </div>
              {gastosPorCategoria.length > 0 ? (
                <div style={{ width: '100%', maxWidth: '400px' }}>
                  <div style={{ marginLeft: '-5px', position: 'relative' }}>
                    <div style={{ width: '100%', height: '300px', position: 'relative', cursor: 'pointer' }}>
                      <Doughnut
                        data={{
                          labels: gastosPorCategoria.map(cat => cat.name),
                          datasets: [{
                            data: gastosPorCategoria.map(cat => cat.value),
                            backgroundColor: gastosPorCategoria.map(cat => cat.color),
                            borderWidth: 0
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          onClick: (_: ChartEvent, elements: ActiveElement[]) => {
                            if (elements && elements.length > 0) {
                              const index = elements[0].index;
                              const categoria = gastosPorCategoria[index].name;
                              const [ano, mes] = mesSelecionadoGrafico.split('-');
                              const usuarioId = localStorage.getItem("userID");
                              const contaId = localStorage.getItem("contaID");
                              
                              if (usuarioId && contaId) {
                                // Ativar loading
                                setIsLoadingTransacoes(true);
                                
                                const url = `https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas/${contaId}/transacoes/por-mes?ano=${ano}&mes=${mes}&categoria=${encodeURIComponent(categoria)}`;
                                
                                fetch(url)
                                  .then(response => response.json())
                                  .then((data: RespostaTransacoes) => {
                                    if (data.status === "OK" && data.objeto.length > 0) {
                                      setTransacoesSelecionadas(data.objeto);
                                      setCategoriaSelecionada(categoria);
                                      setOrigemSelecao('grafico-categoria');
                                      // Resetar cards expandidos ao carregar novas transações
                                      setExpandedCards(new Set());
                                      setDetalhesTransacao({});
                                      setActiveSection('relatorios');
                                    } else {
                                      setTransacoesSelecionadas([]);
                                      setCategoriaSelecionada(categoria);
                                      setOrigemSelecao('grafico-categoria');
                                      // Resetar cards expandidos ao carregar novas transações
                                      setExpandedCards(new Set());
                                      setDetalhesTransacao({});
                                      setActiveSection('relatorios');
                                    }
                                  })
                                  .catch(error => {
                                    console.error("Erro ao buscar transações:", error);
                                    alert("Erro ao buscar as transações. Por favor, tente novamente.");
                                  })
                                  .finally(() => {
                                    // Desativar loading
                                    setIsLoadingTransacoes(false);
                                  });
                              }
                            }
                          },
                          plugins: {
                            legend: {
                              display: false
                            },
                            tooltip: {
                              enabled: true,
                              backgroundColor: 'rgba(0, 0, 0, 0.9)',
                              titleColor: '#ffffff',
                              bodyColor: '#ffffff',
                              borderColor: '#FCD34D',
                              borderWidth: 2,
                              padding: 12,
                              displayColors: true,
                              boxPadding: 6,
                              titleFont: {
                                size: 14,
                                weight: 'bold'
                              },
                              bodyFont: {
                                size: 13
                              },
                              callbacks: {
                                title: (tooltipItems) => {
                                  return `${tooltipItems[0].label}`;
                                },
                                label: (context) => {
                                  const value = context.raw as number;
                                  const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                                  const percentage = ((value / total) * 100).toFixed(1);
                                  return `R$ ${value.toFixed(2).replace('.', ',')} (${percentage}%)`;
                                },
                                afterLabel: () => {
                                  return 'Clique para ver detalhes';
                                }
                              }
                            }
                          },
                          cutout: '65%',
                          animation: {
                            animateRotate: true,
                            animateScale: true,
                            duration: 1000,
                            easing: 'easeInOutQuart' as const
                          },
                          hover: {
                            mode: 'nearest' as const
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div style={{
                    marginTop: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {gastosPorCategoria.map((categoria, index) => (
                      <div 
                        key={index} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          transition: 'all 0.2s ease',
                          border: '1px solid transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#FEF3C7';
                          e.currentTarget.style.border = '1px solid #FCD34D';
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.border = '1px solid transparent';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                        onClick={() => {
                          const [ano, mes] = mesSelecionadoGrafico.split('-');
                          const usuarioId = localStorage.getItem("userID");
                          const contaId = localStorage.getItem("contaID");
                          
                          if (usuarioId && contaId) {
                            // Ativar loading
                            setIsLoadingTransacoes(true);
                            
                            const url = `https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas/${contaId}/transacoes/por-mes?ano=${ano}&mes=${mes}&categoria=${encodeURIComponent(categoria.name)}`;
                            
                            fetch(url)
                              .then(response => response.json())
                              .then((data: RespostaTransacoes) => {
                                if (data.status === "OK" && data.objeto.length > 0) {
                                  setTransacoesSelecionadas(data.objeto);
                                  setCategoriaSelecionada(categoria.name);
                                  setOrigemSelecao('grafico-categoria');
                                  // Resetar cards expandidos ao carregar novas transações
                                  setExpandedCards(new Set());
                                  setDetalhesTransacao({});
                                  setActiveSection('relatorios');
                                } else {
                                  setTransacoesSelecionadas([]);
                                  setCategoriaSelecionada(categoria.name);
                                  setOrigemSelecao('grafico-categoria');
                                  // Resetar cards expandidos ao carregar novas transações
                                  setExpandedCards(new Set());
                                  setDetalhesTransacao({});
                                  setActiveSection('relatorios');
                                }
                              })
                              .catch(error => {
                                console.error("Erro ao buscar transações:", error);
                                alert("Erro ao buscar as transações. Por favor, tente novamente.");
                              })
                              .finally(() => {
                                // Desativar loading
                                setIsLoadingTransacoes(false);
                              });
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: categoria.color,
                            borderRadius: '2px'
                          }} />
                          <span style={{ fontSize: '14px', fontWeight: '500' }}>{categoria.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600' }}>
                            R$ {categoria.value.toFixed(2).replace('.', ',')}
                          </span>
                          <svg style={{ width: '16px', height: '16px', opacity: 0.6 }} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '300px',
                  color: '#64748b'
                }}>
                  Carregando dados...
                </div>
              )}
            </div>

            {/* Gráfico de Barras - Gastos Mensais do Ano */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <h3 style={{ color: '#0065F5', fontSize: '18px', fontWeight: '600', marginBottom: '8px', textAlign: 'center' }}>
                Gastos Mensais do Ano
              </h3>
              {/* Banner informativo */}
              <div style={{
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                maxWidth: '600px',
                animation: 'slideIn 0.5s ease-out'
              }}>
                <svg 
                  style={{ width: '20px', height: '20px', flexShrink: 0 }} 
                  fill="#3B82F6" 
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <span style={{ 
                  color: '#1E40AF', 
                  fontSize: '13px',
                  fontWeight: '500',
                  lineHeight: '1.4'
                }}>
                  <strong>Dica: </strong>Clique em qualquer barra do gráfico para ver detalhes dos gastos do mês!
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                alignItems: 'center', 
                width: '100%', 
                marginBottom: '8px',
                position: 'relative'
              }}>
                {/* Select de anos */}
                <div style={{ position: 'relative', minWidth: '200px' }} data-ano-select-dropdown>
                  <button
                    onClick={() => setIsAnoSelectOpen(!isAnoSelectOpen)}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: 'white',
                      color: '#1e293b',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#0065F5';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 101, 245, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    <span>Ano de {anoSelecionadoGrafico}</span>
                    <svg 
                      style={{ 
                        width: '16px', 
                        height: '16px',
                        transition: 'transform 0.2s ease',
                        transform: isAnoSelectOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                      }} 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M7 10l5 5 5-5z"/>
                    </svg>
                  </button>
                  
                  {/* Dropdown de anos */}
                  {isAnoSelectOpen && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      right: 0,
                      minWidth: '200px',
                      maxHeight: '300px',
                      overflowY: 'auto',
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                      zIndex: 1000,
                      animation: 'slideIn 0.2s ease-out',
                      padding: '4px 0'
                    }}>
                      {anosDisponiveis.length > 0 ? (
                        anosDisponiveis.map(ano => {
                          const isSelected = ano === anoSelecionadoGrafico;
                          
                          return (
                            <button
                              key={ano}
                              onClick={() => {
                                setAnoSelecionadoGrafico(ano);
                                buscarDadosAnuais(ano);
                                setIsAnoSelectOpen(false);
                              }}
                              style={{
                                width: '100%',
                                padding: '10px 16px',
                                border: 'none',
                                backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                                color: isSelected ? '#0065F5' : '#1e293b',
                                fontSize: '14px',
                                fontWeight: isSelected ? '600' : '400',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.backgroundColor = '#F8FAFC';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }
                              }}
                            >
                              Ano de {ano}
                            </button>
                          );
                        })
                      ) : (
                        <div style={{ padding: '10px 16px', color: '#64748b', fontSize: '14px' }}>
                          Nenhum ano com transações
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {gastosMensais.length > 0 ? (
                // Wrapper com position relative para as setas ficarem fixas
                <div style={{ 
                  width: '100%', 
                  height: '250px',
                  position: 'relative'
                }}>
                  {/* Loading overlay quando navegando para relatórios */}
                  {isNavigatingToRelatorios && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 20,
                        borderRadius: '12px',
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          border: '4px solid #e5e7eb',
                          borderTop: '4px solid #0065F5',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite'
                        }}
                      />
                      <p style={{ 
                        marginTop: '16px', 
                        color: '#1e293b', 
                        fontSize: '15px',
                        fontWeight: '500'
                      }}>
                        Carregando relatórios...
                      </p>
                    </div>
                  )}

                  {/* Seta esquerda - FIXA sobre o gráfico */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canScrollLeftAnual) {
                        scrollLeftGraficoAnual();
                      }
                    }}
                    style={{
                      position: 'absolute',
                      left: '-5%',
                      top: '40%',
                      transform: 'translateY(-50%)',
                      zIndex: 15,
                      backgroundColor: canScrollLeftAnual ? 'transparent' : 'rgba(156, 163, 175, 0.5)',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: canScrollLeftAnual ? 'auto' : 'none',
                      cursor: canScrollLeftAnual ? 'pointer' : 'not-allowed',
                      boxShadow: canScrollLeftAnual ? '0 2px 8px rgba(0, 101, 245, 0.3)' : '0 1px 4px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s ease',
                      opacity: canScrollLeftAnual ? 1 : 0.5
                    }}
                    
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={canScrollLeftAnual ? "blue" : "#9CA3AF"}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </div>

                  {/* Seta direita - FIXA sobre o gráfico */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canScrollRightAnual) {
                        scrollRightGraficoAnual();
                      }
                    }}
                    style={{
                      position: 'absolute',
                      right: '-5%',
                      top: '40%',
                      transform: 'translateY(-50%)',
                      zIndex: 15,
                      backgroundColor: canScrollLeftAnual ? 'transparent' : 'rgba(156, 163, 175, 0.5)',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: canScrollRightAnual ? 'auto' : 'none',
                      cursor: canScrollRightAnual ? 'pointer' : 'not-allowed',
                      boxShadow: canScrollRightAnual ? '0 2px 8px rgba(0, 101, 245, 0.3)' : '0 1px 4px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s ease',
                      opacity: canScrollRightAnual ? 1 : 0.5
                    }}
                    
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={canScrollRightAnual ? "blue" : "#9CA3AF"}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>

                  {/* Container scrollável do gráfico */}
                  <div 
                    ref={graficoAnualRef}
                    onMouseDown={handleMouseDownAnual}
                    onMouseLeave={handleMouseLeaveAnual}
                    onMouseUp={handleMouseUpAnual}
                    onMouseMove={handleMouseMoveAnual}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      cursor: 'grab',
                      userSelect: 'none'
                    }}
                  >
                    {isLoadingGraficoAnual && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 10,
                        borderRadius: '12px'
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          border: '4px solid #e5e7eb',
                          borderTop: '4px solid #0065F5',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}
                      />
                      <p style={{ marginTop: '12px', color: '#1e293b', fontSize: '14px' }}>
                        Carregando dados do mês...
                      </p>
                    </div>
                  )}
                  <div style={{ 
                    width: '800px',
                    height: '100%',
                    marginTop: '20px',
                    cursor: 'pointer'
                  }}>
                    <Bar
                      data={{
                        labels: gastosMensais.map(d => d.date),
                        datasets: [{
                          label: 'Total de Gastos',
                          data: gastosMensais.map(d => d.total || 0),
                          backgroundColor: '#0065F5',
                          borderColor: '#0065F5',
                          borderWidth: 1,
                          borderRadius: 3,
                          barThickness: 40,
                          maxBarThickness: 40,
                        }]
                      }}
                      options={{
                        responsive: false,
                        maintainAspectRatio: false,
                        onClick: (_event, elements) => {
                          if (elements && elements.length > 0) {
                            const elementIndex = elements[0].index;
                            const mesClicado = gastosMensais[elementIndex].date;
                            console.log('Mês clicado:', mesClicado);
                            
                            // Limpar dados antigos antes de buscar novos
                            setGastosMesAnual([]);
                            setTransacoesDoMes([]);
                            setMesSelecionadoAnual(null);
                            
                            // Limpar também os dados do gráfico de categoria (Gastos Diários)
                            setCategoriaSelecionada('');
                            setTransacoesSelecionadas([]);
                            
                            // Ativar loading
                            setIsNavigatingToRelatorios(true);
                            
                            // Buscar dados e navegar
                            buscarGastosPorMesAno(mesClicado, anoSelecionadoGrafico);
                            
                            // Pequeno delay para garantir que o loading seja visível
                            setTimeout(() => {
                              setActiveSection('relatorios');
                              // Desativar loading após a navegação
                              setTimeout(() => {
                                setIsNavigatingToRelatorios(false);
                              }, 300);
                            }, 500);
                          }
                        },
                        layout: {
                          padding: {
                            top: 30,
                            bottom: 15
                          }
                        },
                        scales: {
                          x: {
                            display: true,
                            grid: {
                              display: false
                            },
                            ticks: {
                              display: true,
                              color: '#1e293b',
                              font: {
                                size: 12,
                                weight: 500
                              },
                              padding: 5
                            }
                          },
                          y: {
                            display: false,
                            beginAtZero: true
                          }
                        },
                        plugins: {
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                const value = context.parsed.y;
                                return 'Total: R$ ' + value.toFixed(2);
                              }
                            }
                          },
                          legend: {
                            display: false
                          },
                          datalabels: {
                            anchor: 'end',
                            align: 'top',
                            clip: false,
                            formatter: (value: number) => {
                              return 'R$ ' + value.toFixed(2).replace('.', ',');
                            },
                            color: '#1e293b',
                            font: {
                              weight: 'bold',
                              size: 12
                            }
                          }
                        }
                      }}
                      plugins={[ChartDataLabels]}
                      width={800}
                      height={250}
                    />
                  </div>
                </div>
                </div>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '300px',
                  color: '#64748b',
                  fontSize: '16px',
                  textAlign: 'center',
                  width: '100%'
                }}>
                  Carregando dados...
                </div>
              )}
            </div>
          </div>
        );
      case 'relatorios':
        return (
          <div style={{
            width: '100%',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            height: '53%', // Altura total menos o espaço do header
            position: 'fixed',
            top: '38%', // Ajuste conforme necessário para o seu header
            left: '0',
            right: '0',
            overflow: 'hidden'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <h3 style={{ 
                color: '#0065F5', 
                fontSize: '18px', 
                paddingTop: '15px',
                textAlign: 'center',
                width: '100%',
                fontWeight: '600', 
                marginBottom: '0px'
              }}>
                Relatório de Transações
              </h3>
              {categoriaSelecionada && transacoesSelecionadas.length > 0 && (
                <div style={{ marginBottom: '0px' }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '16px',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    padding: '0 16px'
                  }}>
                    <div style={{
                      flex: 1,
                      maxWidth: '50%'
                    }}>
                      <div style={{ 
                        color: '#64748b',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginBottom: '4px'
                      }}>
                        Categoria:
                      </div>
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#1e293b',
                        backgroundColor: '#e2e8f0',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        display: 'inline-block',
                        fontWeight: '500',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}>
                        {categoriaSelecionada}
                      </div>
                    </div>

                    <div style={{
                      flex: 1,
                      maxWidth: '50%'
                    }}>
                      <div style={{ 
                        color: '#64748b',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginBottom: '4px'
                      }}>
                        Período:
                      </div>
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#1e293b',
                        backgroundColor: '#e2e8f0',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        display: 'inline-block',
                        fontWeight: '500',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}>
                        {transacoesSelecionadas.length > 0 && transacoesSelecionadas[0].data ? (
                          origemSelecao === 'grafico-categoria' ? (
                            // Se veio do gráfico de rosca (Gastos por Categoria), mostra só mês/ano
                            `${mesSelecionadoGrafico.split('-')[1]}/${mesSelecionadoGrafico.split('-')[0]}`
                          ) : (
                            // Se veio do gráfico de barras (Gastos Diários), mostra dia/mês/ano
                            new Date(transacoesSelecionadas[0].data).toLocaleDateString('pt-BR')
                          )
                        ) : ''}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                flex: 1,
                overflow: 'hidden'
              }}>
                {/* Lista de transações */}
                {transacoesSelecionadas.length > 0 ? (
                  <div style={{
                    
                    borderRadius: '12px',
                    padding: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(8px)',
                    overflowY: 'auto'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      {[...transacoesSelecionadas]
                        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                        .map((transacao, index) => {
                          const isExpanded = expandedCards.has(index);
                          const detalhe = detalhesTransacao[index];
                          
                          return (
                            <div
                              key={index}
                              style={{
                                backgroundColor: '#f8fafc',
                                borderRadius: '12px',
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                border: '1px solid #e2e8f0',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              {/* Linha principal do card */}
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <div style={{ 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  gap: '4px', 
                                  flex: 1 }}>
                                  {/* Primeira linha: Ícone de check + Aprovado - Tipo */}
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}>
                                    {/* Ícone de check */}
                                    <svg 
                                      width="18" 
                                      height="18" 
                                      viewBox="0 0 24 24" 
                                      fill="none" 
                                      stroke="#000000" 
                                      strokeWidth="3" 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round"
                                      style={{ flexShrink: 0 }}
                                    >
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                    <span style={{ 
                                      fontSize: '14px', 
                                      fontWeight: '600' }}>
                                      Aprovado - {formatarTipoTransacao(transacao.tipo)}
                                    </span>
                                  </div>
                                  {/* Segunda linha: Data e Hora */}
                                  <span style={{ 
                                    fontSize: '14px', 
                                    color: '#64748b' }}>
                                    {new Date(transacao.data).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })} às {new Date(transacao.data).toLocaleTimeString('pt-BR', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '12px' }}>
                                  <span style={{ 
                                    fontSize: '16px', 
                                    fontWeight: '700',
                                    color: '#000000',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    - R$ {Math.abs(transacao.valor).toLocaleString('pt-BR', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}
                                  </span>
                                  <button
                                    onClick={() => {
                                      const newExpanded = new Set(expandedCards);
                                      if (isExpanded) {
                                        newExpanded.delete(index);
                                      } else {
                                        newExpanded.add(index);
                                        // Buscar detalhes se ainda não foram carregados
                                        if (!detalhe) {
                                          const transacaoId = transacao.idTransacao || transacao.id;
                                          
                                          console.log("🔍 Tentando buscar detalhes da transação");
                                          console.log("   - transacao.id:", transacao.id);
                                          console.log("   - transacao.idTransacao:", transacao.idTransacao);
                                          console.log("   - ID final usado:", transacaoId);
                                          console.log("   - transacao completa:", transacao);
                                          
                                          if (transacaoId) {
                                            // Se a transação tem ID, buscar detalhes completos da API
                                            const usuarioId = localStorage.getItem("userID");
                                            const contaId = localStorage.getItem("contaID");
                                            
                                            if (usuarioId && contaId) {
                                              fetch(`https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas/${contaId}/transacoes/${transacaoId}`)
                                                .then(response => response.json())
                                                .then(data => {
                                                  console.log("========== DETALHES DA RESPOSTA ==========");
                                                  console.log("Resposta completa:", JSON.stringify(data, null, 2));
                                                  console.log("data.status:", data.status);
                                                  console.log("data.objeto existe?", !!data.objeto);
                                                  console.log("Tipo de data.objeto:", typeof data.objeto);
                                                  
                                                  if (data && data.status === "OK" && data.objeto) {
                                                  console.log("✅ Transação detalhada recebida");
                                                  console.log("✅ Conteúdo completo:", JSON.stringify(data.objeto, null, 2));
                                                  console.log("✅ Campos disponíveis:", Object.keys(data.objeto));
                                                  console.log("✅ Valores dos campos importantes:");
                                                  console.log("   - tipo:", data.objeto.tipo);
                                                  console.log("   - nomeEstabelecimento:", data.objeto.nomeEstabelecimento);
                                                  console.log("   - numConta:", data.objeto.numConta);
                                                  console.log("   - numContaOrigem:", data.objeto.numContaOrigem);
                                                  console.log("   - numContaDestino:", data.objeto.numContaDestino);
                                                  console.log("   - id:", data.objeto.id);
                                                  console.log("==========================================");
                                                  
                                                  setDetalhesTransacao(prev => ({
                                                    ...prev,
                                                    [index]: data.objeto
                                                  }));
                                                } else {
                                                  console.log("❌ Dados inválidos ou não encontrados");
                                                  console.log("Motivo: data.status =", data?.status, "data.objeto =", data?.objeto);
                                                  setDetalhesTransacao(prev => ({
                                                    ...prev,
                                                    [index]: transacao
                                                  }));
                                                }
                                              })
                                              .catch(error => {
                                                console.error("❌ Erro ao buscar detalhes:", error);
                                                setDetalhesTransacao(prev => ({
                                                  ...prev,
                                                  [index]: transacao
                                                }));
                                              });
                                            }
                                          } else {
                                            // Se a transação não tem ID, usar os dados básicos
                                            console.log("⚠️ Transação sem ID, usando dados básicos");
                                            setDetalhesTransacao(prev => ({
                                              ...prev,
                                              [index]: transacao
                                            }));
                                          }
                                        }
                                      }
                                      setExpandedCards(newExpanded);
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      padding: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'transform 0.3s ease',
                                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                                    }}
                                  >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0065F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              
                              {/* Informações expandidas */}
                              {isExpanded && (
                                <div style={{
                                  marginTop: '12px',
                                  paddingTop: '12px',
                                  borderTop: '1px solid #e2e8f0',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px',
                                  animation: 'slideIn 0.3s ease-out'
                                }}>
                                  {detalhe ? (
                                    <>
                                      {/* Informações comuns a todas as transações */}
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Categoria:</span>
                                        <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{detalhe.categoria}</span>
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Tipo:</span>
                                        <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{formatarTipoTransacao(detalhe.tipo)}</span>
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Valor:</span>
                                        <span style={{ fontSize: '14px', color: '#000000', fontWeight: '700' }}>
                                          - R$ {Math.abs(detalhe.valor).toLocaleString('pt-BR', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                          })}
                                        </span>
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Data/Hora:</span>
                                        <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>
                                          {new Date(detalhe.data).toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </span>
                                      </div>

                                      {/* Divisor */}
                                      <div style={{ borderTop: '1px dashed #e2e8f0', margin: '4px 0' }}></div>

                                      {/* Informações específicas por tipo de transação */}
                                      {detalhe.tipo === 'PIX' && (
                                        <>
                                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Chave Pix:</span>
                                            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{detalhe.chavePixDestino || 'N/A'}</span>
                                          </div>
                                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Destinatário:</span>
                                            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{detalhe.nomeDestinatario || 'N/A'}</span>
                                          </div>
                                        </>
                                      )}

                                      {(detalhe.tipo === 'TRANSFERENCIA_EXTERNA' || detalhe.tipo === 'TRANSFERENCIA_INTERNA') && (
                                        <>
                                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Conta Origem:</span>
                                            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{detalhe.numContaOrigem || 'N/A'}</span>
                                          </div>
                                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Conta Destino:</span>
                                            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{detalhe.numContaDestino || 'N/A'}</span>
                                          </div>
                                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Tipo:</span>
                                            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>
                                              {detalhe.tipo === 'TRANSFERENCIA_INTERNA' ? 'Interna' : 'Externa'}
                                            </span>
                                          </div>
                                        </>
                                      )}

                                      {detalhe.tipo === 'PAGAMENTO_BOLETO' && (
                                        <>
                                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Código de Barras:</span>
                                            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{detalhe.codigoBarras || 'N/A'}</span>
                                          </div>
                                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Beneficiário:</span>
                                            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{detalhe.nomeBeneficiario || 'N/A'}</span>
                                          </div>
                                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Instituição:</span>
                                            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{detalhe.instituicaoFinanceira || 'N/A'}</span>
                                          </div>
                                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Vencimento:</span>
                                            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>
                                              {detalhe.dataVencimento ? new Date(detalhe.dataVencimento).toLocaleDateString('pt-BR') : 'N/A'}
                                            </span>
                                          </div>
                                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Nº Conta:</span>
                                            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{detalhe.numConta || 'N/A'}</span>
                                          </div>
                                        </>
                                      )}

                                      {detalhe.tipo === 'PAGAMENTO_DEBITO' && (
                                        <>
                                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Estabelecimento:</span>
                                            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{detalhe.nomeEstabelecimento || 'N/A'}</span>
                                          </div>
                                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Nº Conta Remetente:</span>
                                            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{detalhe.numConta || 'N/A'}</span>
                                          </div>
                                        </>
                                      )}

                                      {/* ID da transação (comum a todas) */}
                                      <div style={{ borderTop: '1px dashed #e2e8f0', margin: '4px 0' }}></div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>ID da Transação:</span>
                                        <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                                          {detalhe.id ? `${detalhe.id.substring(0, 8)}...` : 'N/A'}
                                        </span>
                                      </div>
                                    </>
                                  ) : (
                                    <div style={{ 
                                      textAlign: 'center', 
                                      color: '#64748b',
                                      fontSize: '14px',
                                      padding: '8px'
                                    }}>
                                      Carregando detalhes...
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : isLoadingGraficoAnual || isNavigatingToRelatorios ? (
                  // Skeleton de loading
                  <div style={{
                    padding: '8px 20px 16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    height: '100%',
                    overflow: 'hidden'
                  }}>
                    {/* Skeleton do título */}
                    <div style={{
                      height: '24px',
                      width: '200px',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '4px',
                      margin: '0 auto',
                      animation: 'pulse 1.5s infinite'
                    }}></div>
                    
                    {/* Skeleton dos cards de resumo */}
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      overflowX: 'hidden',
                      paddingTop: '8px',
                      paddingBottom: '8px'
                    }}>
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          style={{
                            minWidth: '140px',
                            height: '160px',
                            backgroundColor: '#f8fafc',
                            border: '2px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '12px',
                            animation: 'pulse 1.5s infinite',
                            animationDelay: `${i * 0.1}s`
                          }}
                        ></div>
                      ))}
                    </div>
                    
                    {/* Skeleton do título de transações */}
                    <div style={{
                      height: '20px',
                      width: '150px',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '4px',
                      margin: '12px auto 8px auto',
                      animation: 'pulse 1.5s infinite'
                    }}></div>
                    
                    {/* Skeleton dos cards de transações */}
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      padding: '16px',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      minHeight: 0
                    }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          style={{
                            backgroundColor: '#f8fafc',
                            borderRadius: '12px',
                            height: '70px',
                            animation: 'pulse 1.5s infinite',
                            animationDelay: `${i * 0.1}s`
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>
                ) : mesSelecionadoAnual && gastosMesAnual.length > 0 ? (
                  // Mostrar cards do gráfico anual quando não houver transações detalhadas
                  <div style={{
                    padding: '8px 20px 16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    height: '100%',
                    overflow: 'hidden'
                  }}>
                    <h4 style={{
                      color: '#0065F5',
                      fontSize: '15px',
                      fontWeight: '600',
                      marginBottom: '4px',
                      textAlign: 'center',
                      flexShrink: 0
                    }}>
                      Gastos de {mesSelecionadoAnual} - {anoSelecionadoGrafico}
                    </h4>
                    
                    {/* Container scrollável vertical que contém tudo */}
                    <div style={{
                      flex: 1,
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#cbd5e1 #f1f5f9',
                      minHeight: 0
                    }}>
                      {/* Container dos cards de resumo com scroll horizontal */}
                      <div style={{
                        display: 'flex',
                        gap: '12px',
                        overflowX: 'auto',
                        paddingTop: '8px',
                        paddingBottom: '8px',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 #f1f5f9',
                        flexShrink: 0
                      }}>
                      {gastosMesAnual.map((gasto, index) => {
                        // Calcular o total de gastos do mês
                        const totalGastosMes = gastosMesAnual.reduce((acc, g) => acc + g.totalGasto, 0);
                        const percentual = ((gasto.totalGasto / totalGastosMes) * 100).toFixed(1);

                        // Mapear tipoGasto para nome amigável
                        const nomeTipo = (tipo: string) => {
                          switch (tipo) {
                            case 'PIX': return 'PIX';
                            case 'PAGAMENTO_DEBITO': return 'Débito';
                            case 'PAGAMENTO_BOLETO': return 'Boleto';
                            case 'TRANSFERENCIA_INTERNA': 
                            case 'TRANSFERENCIA_EXTERNA': 
                              return 'Transferência';
                            default: return tipo;
                          }
                        };

                        // Ícones SVG por tipo
                        const iconePorTipo = (tipo: string, cor: string) => {
                          switch (tipo) {
                            case 'PIX':
                              return (
                                <img 
                                  src={pixIcon} 
                                  alt="PIX" 
                                  style={{ width: '24px', height: '24px' }} 
                                />
                              );
                            case 'PAGAMENTO_DEBITO':
                              return (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                  <rect x="2" y="5" width="20" height="14" rx="2" fill={cor} opacity="0.2"/>
                                  <rect x="2" y="5" width="20" height="14" rx="2" stroke={cor} strokeWidth="2"/>
                                  <line x1="2" y1="10" x2="22" y2="10" stroke={cor} strokeWidth="2"/>
                                  <line x1="6" y1="15" x2="10" y2="15" stroke={cor} strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                              );
                            case 'PAGAMENTO_BOLETO':
                              return (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                  <rect x="4" y="4" width="16" height="16" rx="2" fill={cor} opacity="0.2"/>
                                  <rect x="4" y="4" width="16" height="16" rx="2" stroke={cor} strokeWidth="2"/>
                                  <line x1="8" y1="9" x2="16" y2="9" stroke={cor} strokeWidth="2" strokeLinecap="round"/>
                                  <line x1="8" y1="13" x2="16" y2="13" stroke={cor} strokeWidth="2" strokeLinecap="round"/>
                                  <line x1="8" y1="17" x2="12" y2="17" stroke={cor} strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                              );
                            case 'TRANSFERENCIA_INTERNA':
                            case 'TRANSFERENCIA_EXTERNA':
                              return (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                  <path d="M12 2v20M12 2l-4 4M12 2l4 4M12 22l-4-4M12 22l4-4" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <circle cx="12" cy="12" r="3" fill={cor} opacity="0.2"/>
                                  <circle cx="12" cy="12" r="3" stroke={cor} strokeWidth="2"/>
                                </svg>
                              );
                            default:
                              return (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                  <circle cx="12" cy="12" r="10" fill={cor} opacity="0.2"/>
                                  <circle cx="12" cy="12" r="10" stroke={cor} strokeWidth="2"/>
                                  <path d="M12 8v4M12 16h.01" stroke={cor} strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                              );
                          }
                        };

                        return (
                          <div
                            key={index}
                            style={{
                              minWidth: 'calc((100% - 24px) / 2.5)',
                              maxWidth: '180px',
                              backgroundColor: 'white',
                              border: '2px solid #e2e8f0',
                              borderRadius: '12px',
                              padding: '12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                              transition: 'all 0.2s ease',
                              flexShrink: 0
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-4px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                              e.currentTarget.style.borderColor = '#0065F5';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                              e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                          >
                            {/* Ícone - Linha 1 */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'flex-start',
                              alignItems: 'center'
                            }}>
                              {iconePorTipo(gasto.tipoGasto, '#0065F5')}
                            </div>
                            
                            {/* Tipo de Gasto - Linha 2 */}
                            <div style={{
                              color: '#0065F5',
                              fontSize: '12px',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: '0.3px',
                              textAlign: 'left'
                            }}>
                              {nomeTipo(gasto.tipoGasto)}
                            </div>
                            
                            {/* Valor - Linha 3 */}
                            <div style={{
                              color: '#1e293b',
                              fontSize: '16px',
                              fontWeight: '700',
                              textAlign: 'left',
                              whiteSpace: 'nowrap'
                            }}>
                              R$ {gasto.totalGasto.toFixed(2).replace('.', ',')}
                            </div>

                            {/* Indicador Circular de Percentual - Linha 4 */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'flex-start',
                              alignItems: 'center',
                              marginTop: '4px'
                            }}>
                              {/* Círculo de progresso */}
                              <div style={{
                                position: 'relative',
                                width: '60px',
                                height: '60px'
                              }}>
                                {/* Círculo de fundo */}
                                <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
                                  <circle
                                    cx="30"
                                    cy="30"
                                    r="24"
                                    fill="none"
                                    stroke="#e2e8f0"
                                    strokeWidth="3"
                                  />
                                  {/* Círculo de progresso */}
                                  <circle
                                    cx="30"
                                    cy="30"
                                    r="24"
                                    fill="none"
                                    stroke="#0065F5"
                                    strokeWidth="3"
                                    strokeDasharray={`${(parseFloat(percentual) / 100) * 150.8} 150.8`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                {/* Percentual no centro */}
                                <div style={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  color: '#0065F5'
                                }}>
                                  {percentual}%
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Título e Cards de transações */}
                    {transacoesDoMes.length > 0 && (
                      <>
                        <h4 style={{
                          color: '#0065F5',
                          fontSize: '14px',
                          fontWeight: '600',
                          margin: '12px 0 8px 0',
                          textAlign: 'center',
                          flexShrink: 0
                        }}>
                          Transações do Mês
                        </h4>
                        
                        {isLoadingTransacoesDoMes ? (
                          // Loading skeleton
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[1, 2, 3].map((i) => (
                              <div key={i} style={{
                                backgroundColor: '#f8fafc',
                                borderRadius: '12px',
                                padding: '12px',
                                height: '60px',
                                animation: 'pulse 1.5s infinite'
                              }} />
                            ))}
                          </div>
                        ) : (
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}>
                            {transacoesDoMes.map((transacao, index) => (
                                <div
                                  key={index}
                                  style={{
                                    backgroundColor: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    padding: '12px 16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                                  }}
                                >
                                  {/* Primeira linha: Aprovado - Tipo e Valor */}
                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}>
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      color: '#1e293b',
                                      fontSize: '14px',
                                      fontWeight: '600',
                                      flex: 1,
                                      minWidth: 0
                                    }}>
                                      {/* Ícone de check */}
                                      <svg 
                                        width="18" 
                                        height="18" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        stroke="#000000" 
                                        strokeWidth="3" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round"
                                        style={{ flexShrink: 0 }}
                                      >
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                      </svg>
                                      <span>Aprovado - {formatarTipoTransacao(transacao.tipo)}</span>
                                    </div>
                                    <div style={{
                                      color: '#000000',
                                      fontSize: '14px',
                                      fontWeight: '700',
                                      whiteSpace: 'nowrap',
                                      flexShrink: 0
                                    }}>
                                      R$ {transacao.valor.toFixed(2).replace('.', ',')}
                                    </div>
                                  </div>
                                  
                                  {/* Segunda linha: Data e Hora */}
                                  <div style={{
                                    color: '#64748b',
                                    fontSize: '13px',
                                    fontWeight: '500'
                                  }}>
                                    {new Date(transacao.data).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })} às {new Date(transacao.data).toLocaleTimeString('pt-BR', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                      </>
                    )}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px',
                    color: '#64748b',
                    gap: '16px'
                  }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    </div>
                    <div style={{
                      textAlign: 'center',
                      maxWidth: '280px'
                    }}>
                      <p style={{ 
                        fontSize: '16px', 
                        fontWeight: '600',
                        color: '#1e293b',
                        marginBottom: '8px'
                      }}>
                        Ops! Ainda não tem nada por aqui 😊
                      </p>
                      <p style={{ 
                        fontSize: '14px',
                        lineHeight: '1.5'
                      }}>
                        Para ver seus gastos detalhados, dê uma olhada no card de "Gráficos" e clique em uma categoria que você queira explorar!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div style={{
        position: 'absolute',
        top: '0px',
        left: '0px',
        width: '393px',
        height: '852px',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        boxSizing: 'border-box',

        
        /* Ocultar barra de scroll mantendo funcionalidade */
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      } as React.CSSProperties}>
        
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
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px', // distancia entre engrenagem e perfil
            marginTop: '20px' //  empurra os ícones para baixo
          }}>

            <Settings size={26} />

            <div style={{ display: 'flex', gap: '22px' }}>
              <MessageCircle size={26} />
              <Bell size={26} />
            </div>
          </div>

          {/* Perfil */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleProfileClick}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: '2px solid white',
                backgroundColor: userAvatar ? 'transparent' : '#1e40af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 'bold',
                cursor: 'pointer',
                color: 'white',
                overflow: 'hidden',
                padding: 0
              }}
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt="Avatar do usuário"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }}
                />
              ) : (
                userName.charAt(0).toUpperCase()
              )}
            </button>
            <div>
              <p style={{ fontSize: '18px', fontWeight: '500', margin: 0 }}>Olá, {userName}!</p>
              {/* Exibição do número da conta */}
              <p style={{ 
                fontSize: '12px', 
                fontWeight: '400', 
                margin: '2px 0 0 0',
                color: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                Conta: {isLoadingSaldo ? (
                  <ValueSkeleton width="60px" />
                ) : (
                  numeroConta
                )}
              </p>
            </div>
          </div>

          {/* Saldo */}
          <div style={{ 
            marginTop: '0px', 
            position: 'relative',
            borderRadius: '12px',
            padding: '8px',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}>
              <div style={{ 
                fontSize: '32px',
                fontWeight: 'bold', 
                margin: 0,
                lineHeight: '1.2',
                color: 'white',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                whiteSpace: 'nowrap', // impede quebra de linha
                display: 'inline-block'
              }}>
                {isLoadingSaldo ? (
                  <ValueSkeleton width="120px" />
                ) : (
                  `R$ ${showBalance ? "•••••" : saldo !== null ? saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00"}`
                )}
              </div>
              <button 
                onClick={() => setShowBalance(!showBalance)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showBalance ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
            <button 
              onClick={handleVerExtratoClick}
              style={{
              fontSize: '14px',
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              position: 'absolute',
              left: '170px',
              top: '50px',
              padding: '0',
              margin: '0',
              lineHeight: '1',
            }}>
              Ver extrato
            </button>
          </div>
        </div>

        {/* Ações principais - Camada independente que sobrepõe ambos os cards */}
        <div style={{
          position: 'fixed',
          top: '230px', 
          left: '16px',
          right: '16px',
          zIndex: 1002, // Sobrepõe tanto o card azul (1000) quanto o branco (1001)
          display: 'flex',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <button 
            onClick={handleControleGastoClick}
            style={{
              backgroundColor: activeSection === 'controle' ? '#2563eb' : 'white',
              color: activeSection === 'controle' ? 'white' : '#2563eb',
              fontWeight: '500',
              padding: '8px',
              borderRadius: '12px',
              border: activeSection === 'controle' ? '2px solid white' : 'none',
              cursor: 'pointer',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              minHeight: '60px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (activeSection !== 'controle') {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSection !== 'controle') {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            <svg style={{ width: '24px', height: '24px' }} fill="currentColor" viewBox="0 0 24 24">
              {/* Ícone de controle de gastos */}
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Controle de Gasto
          </button>
          <button 
            onClick={handleGraficosClick}
            style={{
            backgroundColor: activeSection === 'graficos' ? '#2563eb' : 'white',
            color: activeSection === 'graficos' ? 'white' : '#2563eb',
            fontWeight: '500',
            padding: '8px',
            borderRadius: '12px',
            border: activeSection === 'graficos' ? '2px solid white' : 'none',
            cursor: 'pointer',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            minHeight: '60px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease'
          }}
            onMouseEnter={(e) => {
              if (activeSection !== 'graficos') {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSection !== 'graficos') {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }
            }}>
            <svg style={{ width: '24px', height: '24px' }} fill="currentColor" viewBox="0 0 24 24">
              {/* Ícone de gráficos */}
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
            Gráficos
          </button>
          <button 
            onClick={handleRelatoriosClick}
            style={{
              backgroundColor: activeSection === 'relatorios' ? '#2563eb' : 'white',
              color: activeSection === 'relatorios' ? 'white' : '#2563eb',
              fontWeight: '500',
              padding: '8px',
              borderRadius: '12px',
              border: activeSection === 'relatorios' ? '2px solid white' : 'none',
              cursor: 'pointer',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              minHeight: '60px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (activeSection !== 'relatorios') {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSection !== 'relatorios') {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            <svg style={{ width: '24px', height: '24px' }} fill="currentColor" viewBox="0 0 24 24">
              {/* Ícone de relatórios */}
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
            Relatórios
          </button>
        </div>

        {/* Espaçador para compensar header fixo */}
        <div style={{ height: '200px' }}></div>

        {/* Card branco fixo no bottom */}
        <div style={{
          position: 'fixed',
          left: '0px',
          right: '0px',
          top: '290px', 
          bottom: '0px', 
          borderTopRightRadius: '16px',
          borderTopLeftRadius: '16px',
          width: '100%',
          backgroundColor: 'white',
          zIndex: 1001, // Sobrepõe o card azul (que tem z-index 1000)
          display: 'flex',
          flexDirection: 'column'
        }}>
          
          {/* Container com scroll para o conteúdo interno */}
          <div style={{
            padding: '24px',
            paddingTop: '60px', // Aumentei de 24px para 40px para empurrar o conteúdo para baixo
            paddingBottom: '120px', // Aumentado de 100px para 200px para mais espaço de scroll
            overflowY: 'auto',
            flex: 1
          }}>
            {/* Renderiza o conteúdo dinâmico baseado no botão ativo */}
            {renderActiveContent()}
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoadingTransacoes && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px 48px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              animation: 'slideIn 0.3s ease-out'
            }}>
              {/* Spinner animado */}
              <div style={{
                width: '50px',
                height: '50px',
                border: '4px solid #E5E7EB',
                borderTop: '4px solid #0065F5',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <p style={{
                  margin: 0,
                  color: '#1E293B',
                  fontSize: '18px',
                  fontWeight: '600'
                }}>
                  Carregando transações...
                </p>
                <p style={{
                  margin: 0,
                  color: '#64748B',
                  fontSize: '14px'
                }}>
                  Por favor, aguarde
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      <Menubar />
    </>
  );
};

export default Home;
