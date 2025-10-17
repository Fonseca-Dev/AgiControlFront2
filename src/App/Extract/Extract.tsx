import React, { useEffect, useState } from "react";
import Menubar from "../Menubar/Menubar";
import { useTransacao } from "../../contexts/TransacaoContext";
import type { Transacao } from "../../contexts/TransacaoContext";
import pixIcon from "../../assets/images/pix.png";
import iosShareIcon from "../../assets/images/ios_share.png";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  PlusCircle, 
  Trash2,
  Repeat,
  Send,
  FileText,
  CreditCard,
  Download,
  Pocket,
  Folder,
  Circle 
} from 'react-feather';
 

const Extract: React.FC = () => {
  const [saldo, setSaldo] = useState<number | null>(null);
  const [, setContaId] = useState<string | null>(null);
  const [isTransacoesLoading, setIsTransacoesLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [totalCarteiras, setTotalCarteiras] = useState<number>(0);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [selectedTransacao, setSelectedTransacao] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isClickLoading, setIsClickLoading] = useState(false);
  const { transacoes, setTransacoes } = useTransacao();
  
  // Estados para filtros
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTipoTransacao, setSelectedTipoTransacao] = useState<'all' | 'entrada' | 'saida'>('all');
  const [selectedMetodo, setSelectedMetodo] = useState<string>('all');

  // Função local para renderizar ícone com cor personalizada
  const renderIconComCor = (iconType: string, cor: string): JSX.Element => {
    const iconStyle = {
      width: '24px',
      height: '24px',
      color: cor
    };

    switch (iconType) {
      case 'arrow-down-circle':
        return <ArrowDownCircle style={iconStyle} />;
      case 'arrow-up-circle':
        return <ArrowUpCircle style={iconStyle} />;
      case 'plus-circle':
        return <PlusCircle style={iconStyle} />;
      case 'trash-2':
        return <Trash2 style={iconStyle} />;
      case 'repeat':
        return <Repeat style={iconStyle} />;
      case 'send':
        return <Send style={iconStyle} />;
      case 'file-text':
        return <FileText style={iconStyle} />;
      case 'credit-card':
        return <CreditCard style={iconStyle} />;
      case 'download':
        return <Download style={iconStyle} />;
      case 'pocket':
        return <Pocket style={iconStyle} />;
      case 'folder':
        return <Folder style={iconStyle} />;
      default:
        return <Circle style={iconStyle} />;
    }
  };

  // Função para buscar detalhes de uma transação específica
  const fetchTransacaoDetails = async (transacaoId: string) => {
    setIsClickLoading(true); // Mostra loading imediatamente
    setIsLoadingDetails(true);
    const usuarioId = localStorage.getItem("userID");
    const contaId = localStorage.getItem("contaId");

    try {
      const response = await fetch(
        `https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas/${contaId}/transacoes/${transacaoId}`
      );
      const data = await response.json();
      
      if (data && data.objeto) {
        setSelectedTransacao(data.objeto);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Erro ao buscar detalhes da transação:", error);
    } finally {
      setIsLoadingDetails(false);
      setIsClickLoading(false); // Remove loading ao finalizar
    }
  };

  // Função para obter lista única de meses/anos disponíveis nas transações
  const getAvailableDates = () => {
    const dates = transacoes.map(t => {
      const date = new Date(t.id);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    });
    return ['all', ...Array.from(new Set(dates))].sort().reverse();
  };

  // Função para filtrar transações pelo mês/ano selecionado
  const getFilteredTransacoes = () => {
    return transacoes.filter(t => {
      // Filtro por data
      if (selectedDate !== 'all') {
        const date = new Date(t.id);
        const transactionDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (transactionDate !== selectedDate) return false;
      }

      // Filtro por tipo (entrada/saída)
      if (selectedTipoTransacao !== 'all') {
        if (t.tipoTransacao !== selectedTipoTransacao) return false;
      }

      // Filtro por método
      if (selectedMetodo !== 'all') {
        if (t.metodo !== selectedMetodo) return false;
      }

      return true;
    });
  };

  // ===================================================================
  // FUNÇÕES DE EXPORTAÇÃO PDF E EXCEL
  // ===================================================================
  
  // Exportar para PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const filteredData = getFilteredTransacoes();
    
    // Título
    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235); // Azul #2563eb
    doc.text('Extrato de Transações', 14, 20);
    
    // Informações do resumo
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const entradas = filteredData.filter(t => t.tipoTransacao === 'entrada').reduce((sum, t) => sum + t.valor, 0);
    const saidas = filteredData.filter(t => t.tipoTransacao === 'saida').reduce((sum, t) => sum + t.valor, 0);
    
    doc.text(`Saldo Atual: R$ ${saldo?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}`, 14, 30);
    doc.text(`Total Entradas: R$ ${entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, 37);
    doc.text(`Total Saídas: R$ ${saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, 44);
    doc.text(`Total Carteiras: R$ ${totalCarteiras.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, 51);
    doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 14, 58);
    
    // Tabela de transações
    const tableData = filteredData.map(t => [
      t.data,
      t.horario,
      t.tipo,
      t.metodo,
      t.tipoTransacao === 'entrada' ? '+' : '-',
      `R$ ${t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ]);
    
    autoTable(doc, {
      head: [['Data', 'Hora', 'Tipo', 'Método', '+/-', 'Valor']],
      body: tableData as any,
      startY: 65,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 18 },
        2: { cellWidth: 45 },
        3: { cellWidth: 30 },
        4: { cellWidth: 12, halign: 'center' },
        5: { cellWidth: 30, halign: 'right' }
      },
      didParseCell: (data) => {
        // Colorir valores de entrada e saída
        if (data.column.index === 4 && data.section === 'body') {
          if (data.cell.text[0] === '+') {
            data.cell.styles.textColor = [0, 205, 92]; // Verde
          } else {
            data.cell.styles.textColor = [239, 68, 68]; // Vermelho
          }
        }
      }
    });
    
    // Salvar PDF
    const fileName = `extrato_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };
  
  // Exportar para Excel
  const exportToExcel = () => {
    const filteredData = getFilteredTransacoes();
    
    // Dados do resumo
    const entradas = filteredData.filter(t => t.tipoTransacao === 'entrada').reduce((sum, t) => sum + t.valor, 0);
    const saidas = filteredData.filter(t => t.tipoTransacao === 'saida').reduce((sum, t) => sum + t.valor, 0);
    
    const resumoData = [
      ['EXTRATO DE TRANSAÇÕES'],
      [''],
      ['Saldo Atual:', `R$ ${saldo?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}`],
      ['Total Entradas:', `R$ ${entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ['Total Saídas:', `R$ ${saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ['Total Carteiras:', `R$ ${totalCarteiras.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ['Data de Geração:', `${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`],
      [''],
      ['Data', 'Hora', 'Tipo', 'Método', 'Tipo Transação', 'Valor']
    ];
    
    // Dados das transações
    const transacoesData = filteredData.map(t => [
      t.data,
      t.horario,
      t.tipo,
      t.metodo,
      t.tipoTransacao === 'entrada' ? 'Entrada' : 'Saída',
      t.valor
    ]);
    
    // Combinar dados
    const fullData = [...resumoData, ...transacoesData];
    
    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(fullData);
    
    // Ajustar largura das colunas
    ws['!cols'] = [
      { wch: 12 },  // Data
      { wch: 8 },   // Hora
      { wch: 25 },  // Tipo
      { wch: 15 },  // Método
      { wch: 15 },  // Tipo Transação
      { wch: 15 }   // Valor
    ];
    
    // Criar workbook e adicionar worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Extrato');
    
    // Salvar arquivo
    const fileName = `extrato_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Função para buscar e atualizar transações
  const fetchTransacoes = (usuarioId: string, idConta: string) => {
    setIsTransacoesLoading(true);
    fetch(`https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas/${idConta}/transacoes` )
      .then(res => res.json())
      .then(data => {
        if (data && data.objeto) {
          const transacoesMapeadas = data.objeto.map((item: any): Transacao | null => {
            
            let tipoDescritivo = '';
            let icon = 'cifrao';
            let tipoTransacao: 'entrada' | 'saida' = 'saida'; // Padrão é saida
            let metodo = 'App';
            const valor = Math.abs(item.dados.valor);

            // ===================================================================
            // LÓGICA DE MAPEAMENTO REFINADA E CORRIGIDA
            // ===================================================================
            switch (item.tipo) {
              case 'DEPOSITO_CONTA':
                tipoDescritivo = 'Depósito na Conta';
                tipoTransacao = 'entrada';
                icon = 'arrow-down-circle'; // Ícone de seta para baixo em círculo
                metodo = 'Depósito na Conta';
                break;
              
              case 'SAQUE_CONTA':
                tipoDescritivo = 'Saque da Conta';
                tipoTransacao = 'saida';
                icon = 'arrow-up-circle'; // Ícone de seta para cima em círculo
                metodo = 'Saque da Conta';
                break;

              case 'CRIAR_CARTEIRA':
                tipoDescritivo = 'Criar Carteira';
                tipoTransacao = 'saida';
                icon = 'plus-circle'; // Ícone de mais em círculo
                metodo = 'Criar Carteira';
                break;

              case 'DELETAR_CARTEIRA':
                tipoDescritivo = 'Deletar Carteira';
                tipoTransacao = 'entrada';
                icon = 'trash-2'; // Ícone de lixeira
                metodo = 'Deletar Carteira';
                break;
              
              case 'TRANSFERENCIA_INTERNA':
                tipoDescritivo = 'Transferência TED';
                tipoTransacao = 'saida';
                icon = 'repeat'; // Ícone de setas circulares
                metodo = 'Transferencia Bancária';
                break;

              case 'TRANSFERENCIA_EXTERNA':
                tipoDescritivo = 'Transferência TED';
                tipoTransacao = 'saida';
                icon = 'send'; // Ícone de avião de papel
                metodo = 'Transferencia Bancária';
                break;

              case 'PAGAMENTO_BOLETO':
                tipoDescritivo = 'Pagamento Boleto';
                tipoTransacao = 'saida';
                icon = 'file-text'; // Ícone de documento
                metodo = 'Pagamento Boleto';
                break;
              
              case 'PAGAMENTO_DEBITO':
                tipoDescritivo = 'Pagamento no Débito';
                tipoTransacao = 'saida';
                icon = 'credit-card'; // Ícone de cartão
                metodo = 'Pagamento no Débito';
                break;

              case 'PIX':
                tipoDescritivo = 'Transferência PIX';
                tipoTransacao = 'saida';
                icon = 'pix'; // Ícone customizado do PIX
                metodo = 'PIX Enviado';
                break;

              case 'TRANSFERENCIA_RECEBIDA':
                tipoDescritivo = 'Transferência recebida';
                tipoTransacao = 'entrada';
                icon = 'download'; // Ícone de download
                metodo = 'Transferência Recebida';
                break;

              case 'PIX_RECEBIDO':
                tipoDescritivo = 'PIX recebido';
                tipoTransacao = 'entrada';
                icon = 'pix'; // Mesmo ícone para PIX recebido
                metodo = 'PIX Recebido'
                break;

              case 'DEPOSITO_CARTEIRA':
                tipoDescritivo = 'Depósito na Carteira';
                tipoTransacao = 'saida';
                icon = 'pocket'; // Ícone de bolso/carteira com seta entrando
                metodo = 'Deposito na Carteira';
                break;

              case 'SAQUE_CARTEIRA':
                tipoDescritivo = 'Saque da Carteira';
                tipoTransacao = 'entrada';
                icon = 'folder'; // Ícone de pasta/carteira com seta saindo
                metodo = 'Saque da Carteira';
                break;

              default:
                console.warn("Tipo de transação não mapeado:", item.tipo);
                return null; // Ignora tipos não conhecidos
            }
            // ===================================================================
            // FIM DA LÓGICA
            // ===================================================================

            return {
              id: item.data,
              transacaoId: item.id, // ID real da transação para buscar detalhes
              tipo: tipoDescritivo,
              icon: icon,
              horario: new Date(item.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              data: new Date(item.data).toLocaleDateString('pt-BR'),
              valor: valor,
              metodo: metodo,
              tipoTransacao: tipoTransacao,
            };
          })

          setTransacoes(transacoesMapeadas);
        }
      })
      .catch(err => console.error("Erro ao processar transações:", err))
      .finally(() => {
        setIsTransacoesLoading(false);
      });
  };

  const fetchTotalCarteiras = (usuarioId: string, contaId: string) => {
    fetch(`https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas/${contaId}/carteiras`)
      .then(res => res.json())
      .then(data => {
        if (data && data.objeto) {
          const carteirasAtivas = data.objeto.filter((carteira: any) => carteira.estado === 'ATIVA');
          const total = carteirasAtivas.reduce((total: number, carteira: any) => total + carteira.saldo, 0);
          setTotalCarteiras(total);
        }
      })
      .catch(err => console.error("Erro ao buscar total das carteiras:", err));
  };

  useEffect(() => {
    // --- CORREÇÃO: Limpa o estado imediatamente ao iniciar a busca ---
    setTransacoes([]);
    // ----------------------------------------------------------------

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
            localStorage.setItem("contaId", ultimaConta.id); // Salva o contaId no localStorage
            // Após encontrar a conta, busca as transações e o total das carteiras
            fetchTransacoes(usuarioId, ultimaConta.id);
            fetchTotalCarteiras(usuarioId, ultimaConta.id);
          }
        })
        .catch(err => console.error("Erro ao buscar saldo:", err));
    }
  }, [setTransacoes]);

  // Effect para fechar o dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSelectOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-select-dropdown]')) {
          setIsSelectOpen(false);
        }
      }
      // Fechar menu de exportação ao clicar fora
      if (showExportMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-export-menu]')) {
          setShowExportMenu(false);
        }
      }
      // Fechar menu de filtros ao clicar fora
      if (isFilterOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-filter-menu]')) {
          setIsFilterOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSelectOpen, showExportMenu, isFilterOpen]);







  return (
    <>
      <Menubar />



      {/* txt "Saldo atual"*/}
      <div style={{
        position: 'fixed',
        top: '8%',
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
        top: '10%',
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
          {saldo !== null 
              ? `R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
              : <div style={{
                  width: '200px',
                  height: '36px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  animation: 'pulse 1.5s infinite'
                }}></div>
          }
        </div>
      </div>

      {/* Ícone de seta para a direita */}
      <div style={{
        position: 'fixed',
        top: '12%',
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



      {/* txt "Histórico" */}
      <div style={{
        position: 'fixed',
        left: '16px',
        top: '285px',
        zIndex: 1002,
        color: 'white',
        fontSize: '18px',
        fontWeight: 'bold'
      }}>
        Histórico
      </div>

      {/* Ícone de Compartilhar/Exportar */}
      <div 
        data-export-menu
        style={{
          position: 'fixed',
          right: '5%',
          top: '31%',
          zIndex: 1010
        }}
      >
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          
            transition: 'all 0.2s ease'
          }}
        >
          <img 
            src={iosShareIcon} 
            alt="Exportar" 
            style={{ 
              width: '25px', 
              height: '25px',
              objectFit: 'contain'
            }} 
          />
        </button>

        {/* Menu de Exportação */}
        {showExportMenu && (
          <div style={{
            position: 'absolute',
            top: '48px',
            right: '0',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            padding: '8px',
            minWidth: '180px',
            animation: 'fadeIn 0.2s ease',
            zIndex: 1011
          }}>
            {/* Botão Exportar PDF */}
            <button
              onClick={() => {
                exportToPDF();
                setShowExportMenu(false);
              }}
              disabled={getFilteredTransacoes().length === 0}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: getFilteredTransacoes().length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderRadius: '8px',
                transition: 'background-color 0.2s ease',
                opacity: getFilteredTransacoes().length === 0 ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (getFilteredTransacoes().length > 0) {
                  e.currentTarget.style.backgroundColor = '#fef2f2';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#1e293b'
              }}>
                Exportar PDF
              </span>
            </button>

            {/* Separador */}
            <div style={{
              height: '1px',
              backgroundColor: '#e2e8f0',
              margin: '4px 0'
            }}></div>

            {/* Botão Exportar Excel */}
            <button
              onClick={() => {
                exportToExcel();
                setShowExportMenu(false);
              }}
              disabled={getFilteredTransacoes().length === 0}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: getFilteredTransacoes().length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderRadius: '8px',
                transition: 'background-color 0.2s ease',
                opacity: getFilteredTransacoes().length === 0 ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (getFilteredTransacoes().length > 0) {
                  e.currentTarget.style.backgroundColor = '#f0fdf4';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <rect x="8" y="12" width="8" height="8" rx="1"/>
                <line x1="10" y1="12" x2="10" y2="20"/>
                <line x1="14" y1="12" x2="14" y2="20"/>
                <line x1="8" y1="16" x2="16" y2="16"/>
              </svg>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#1e293b'
              }}>
                Exportar Excel
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Card de resumo de transações */}
      <div style={{
        position: 'fixed',
        left: '16px',
        right: '16px',
        top: '20%',
        zIndex: 1003,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Entradas */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'white', fontSize: '14px', opacity: 0.8 }}>Entradas</div>
          <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>
            {isTransacoesLoading ? (
              <div style={{
                width: '80px',
                height: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                animation: 'pulse 1.5s infinite'
              }}></div>
            ) : (
              `R$ ${getFilteredTransacoes()
                .filter(t => t.tipoTransacao === 'entrada')
                .reduce((sum, t) => sum + t.valor, 0)
                .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )}
          </div>
        </div>

        {/* Carteiras */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'white', fontSize: '14px', opacity: 0.8 }}>Carteiras</div>
          <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>
            {isTransacoesLoading ? (
              <div style={{
                width: '80px',
                height: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                animation: 'pulse 1.5s infinite'
              }}></div>
            ) : (
              `R$ ${totalCarteiras.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )}
          </div>
        </div>

        {/* Saídas */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'white', fontSize: '14px', opacity: 0.8 }}>Saídas</div>
          <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>
            {isTransacoesLoading ? (
              <div style={{
                width: '80px',
                height: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                animation: 'pulse 1.5s infinite'
              }}></div>
            ) : (
              `R$ ${getFilteredTransacoes()
                .filter(t => t.tipoTransacao === 'saida')
                .reduce((sum, t) => sum + t.valor, 0)
                .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )}
          </div>
        </div>
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
        {/* Filtros */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #f1f5f9',
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Linha de filtros */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px'
          }}>
            {/* Botão Filtros */}
            <div style={{ position: 'relative' }} data-filter-menu>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: (selectedTipoTransacao !== 'all' || selectedMetodo !== 'all') ? '#EFF6FF' : 'white',
                  color: (selectedTipoTransacao !== 'all' || selectedMetodo !== 'all') ? '#0065F5' : '#1e293b',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                Filtros
                {(selectedTipoTransacao !== 'all' || selectedMetodo !== 'all') && (
                  <span style={{
                    backgroundColor: '#0065F5',
                    color: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>
                    {(selectedTipoTransacao !== 'all' ? 1 : 0) + (selectedMetodo !== 'all' ? 1 : 0)}
                  </span>
                )}
              </button>

              {/* Dropdown de Filtros */}
              {isFilterOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  minWidth: '250px',
                  maxHeight: '400px',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                  zIndex: 1000,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
                  {/* Conteúdo com scroll */}
                  <div style={{
                    overflowY: 'auto',
                    maxHeight: '320px',
                    padding: '12px',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#cbd5e1 #f1f5f9'
                  } as React.CSSProperties}>
                    {/* Filtro por Tipo */}
                    <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748b',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Tipo de Transação
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {[
                        { value: 'all', label: 'Todas' },
                        { value: 'entrada', label: 'Entradas' },
                        { value: 'saida', label: 'Saídas' }
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => setSelectedTipoTransacao(option.value as 'all' | 'entrada' | 'saida')}
                          style={{
                            padding: '8px 12px',
                            border: 'none',
                            borderRadius: '8px',
                            backgroundColor: selectedTipoTransacao === option.value ? '#EFF6FF' : 'transparent',
                            color: selectedTipoTransacao === option.value ? '#0065F5' : '#1e293b',
                            fontSize: '14px',
                            fontWeight: selectedTipoTransacao === option.value ? '600' : '400',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => {
                            if (selectedTipoTransacao !== option.value) {
                              e.currentTarget.style.backgroundColor = '#f8fafc';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedTipoTransacao !== option.value) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          {option.label}
                          {selectedTipoTransacao === option.value && (
                            <span style={{ color: '#0065F5' }}>✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Separador */}
                  <div style={{
                    height: '1px',
                    backgroundColor: '#e2e8f0',
                    margin: '12px 0'
                  }}></div>

                  {/* Filtro por Método */}
                  <div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748b',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Método
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {[
                        { value: 'all', label: 'Todos' },
                        { value: 'Depósito na Conta', label: 'Depósito na Conta' },
                        { value: 'Saque da Conta', label: 'Saque da Conta' },
                        { value: 'PIX Enviado', label: 'PIX Enviado' },
                        { value: 'PIX Recebido', label: 'PIX Recebido' },
                        { value: 'Transferencia Bancária', label: 'Transferência Bancária (TED)' },
                        { value: 'Transferência Recebida', label: 'Transferência Recebida' },
                        { value: 'Pagamento Boleto', label: 'Pagamento Boleto' },
                        { value: 'Pagamento no Débito', label: 'Pagamento no Débito' },
                        { value: 'Deposito na Carteira', label: 'Depósito na Carteira' },
                        { value: 'Saque da Carteira', label: 'Saque da Carteira' },
                        { value: 'Criar Carteira', label: 'Criar Carteira' },
                        { value: 'Deletar Carteira', label: 'Deletar Carteira' }
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => setSelectedMetodo(option.value)}
                          style={{
                            padding: '8px 12px',
                            border: 'none',
                            borderRadius: '8px',
                            backgroundColor: selectedMetodo === option.value ? '#EFF6FF' : 'transparent',
                            color: selectedMetodo === option.value ? '#0065F5' : '#1e293b',
                            fontSize: '14px',
                            fontWeight: selectedMetodo === option.value ? '600' : '400',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => {
                            if (selectedMetodo !== option.value) {
                              e.currentTarget.style.backgroundColor = '#f8fafc';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedMetodo !== option.value) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          {option.label}
                          {selectedMetodo === option.value && (
                            <span style={{ color: '#0065F5' }}>✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Botão Limpar Filtros */}
                  {(selectedTipoTransacao !== 'all' || selectedMetodo !== 'all') && (
                    <>
                      <div style={{
                        height: '1px',
                        backgroundColor: '#e2e8f0',
                        margin: '12px 0'
                      }}></div>
                      <button
                        onClick={() => {
                          setSelectedTipoTransacao('all');
                          setSelectedMetodo('all');
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: 'none',
                          borderRadius: '8px',
                          backgroundColor: '#fef2f2',
                          color: '#ef4444',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fee2e2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#fef2f2';
                        }}
                      >
                        Limpar Filtros
                      </button>
                    </>
                  )}
                  </div>
                </div>
              )}
            </div>

            {/* Select de data customizado */}
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
                {selectedDate === 'all' ? 'Todas as transações' : (() => {
                  const [year, month] = selectedDate.split('-');
                  const monthName = new Date(Number(year), Number(month) - 1).toLocaleString('pt-BR', { month: 'long' });
                  return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`;
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
                padding: '4px 0'
              }}>
                {/* Opção "Todas as transações" */}
                <button
                  onClick={() => {
                    setSelectedDate('all');
                    setIsSelectOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    margin: 0,
                    border: 'none',
                    backgroundColor: selectedDate === 'all' ? '#EFF6FF' : 'white',
                    color: selectedDate === 'all' ? '#0065F5' : '#1e293b',
                    fontSize: '14px',
                    fontWeight: selectedDate === 'all' ? '600' : '400',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    display: 'block'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedDate !== 'all') {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedDate !== 'all') {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  Todas as transações
                  {selectedDate === 'all' && (
                    <span style={{ float: 'right', color: '#0065F5' }}>✓</span>
                  )}
                </button>

                {/* Meses disponíveis */}
                {getAvailableDates().filter(date => date !== 'all').map(date => {
                  const [year, month] = date.split('-');
                  const monthName = new Date(Number(year), Number(month) - 1).toLocaleString('pt-BR', { month: 'long' });
                  const displayText = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`;
                  const isSelected = date === selectedDate;
                  
                  return (
                    <button
                      key={date}
                      onClick={() => {
                        setSelectedDate(date);
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
                })}
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Conteúdo do card branco */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 16px',
          paddingBottom: '80px',
          backgroundColor: 'white'
        }}>
          {/* LÓGICA DE CARREGAMENTO */}
          {isTransacoesLoading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '20px 0'
            }}>
              {[1, 2, 3, 4].map((_, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  height: '72px',
                  animation: 'pulse 1.5s infinite'
                }}>
                  {/* Skeleton para o ícone */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '12px',
                    marginRight: '12px'
                  }}></div>
                  
                  {/* Skeleton para o conteúdo */}
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    {/* Lado esquerdo */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{
                        width: '120px',
                        height: '16px',
                        backgroundColor: '#f1f5f9',
                        borderRadius: '4px'
                      }}></div>
                      <div style={{
                        width: '80px',
                        height: '14px',
                        backgroundColor: '#f1f5f9',
                        borderRadius: '4px'
                      }}></div>
                    </div>
                    
                    {/* Lado direito */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                      <div style={{
                        width: '100px',
                        height: '16px',
                        backgroundColor: '#f1f5f9',
                        borderRadius: '4px'
                      }}></div>
                      <div style={{
                        width: '60px',
                        height: '14px',
                        backgroundColor: '#f1f5f9',
                        borderRadius: '4px'
                      }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Lista de transações
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {getFilteredTransacoes().map((transacao, index) => (
                <div 
                  key={transacao.id} 
                  onClick={() => transacao.transacaoId && fetchTransacaoDetails(transacao.transacaoId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: `0 ${2 + index}px ${8 + index * 2}px -2px rgba(0, 0, 0, 0.1), 0 ${1 + index}px ${4 + index}px -1px rgba(0, 0, 0, 0.06)`,
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = `0 ${4 + index}px ${12 + index * 2}px -2px rgba(0, 0, 0, 0.15), 0 ${2 + index}px ${6 + index}px -1px rgba(0, 0, 0, 0.08)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = `0 ${2 + index}px ${8 + index * 2}px -2px rgba(0, 0, 0, 0.1), 0 ${1 + index}px ${4 + index}px -1px rgba(0, 0, 0, 0.06)`;
                  }}
                >
                  {/* Ícone */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px',
                    flexShrink: 0
                  }}>
                    {transacao.icon === 'pix' ? (
                      <img 
                        src={pixIcon} 
                        alt="PIX" 
                        width="24" 
                        height="24" 
                        style={{
                          filter: transacao.tipoTransacao === 'entrada' 
                            ? 'brightness(0) saturate(100%) invert(64%) sepia(98%) saturate(424%) hue-rotate(95deg) brightness(91%) contrast(86%)'
                            : 'brightness(0)'
                        }} 
                      />
                    ) : (
                      renderIconComCor(
                        transacao.icon, 
                        transacao.tipoTransacao === 'entrada' ? '#10b981' : '#000000'
                      )
                    )}
                  </div>

                  {/* Informações da transação */}
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    {/* Lado esquerdo - Tipo e horário */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1e293b',
                        marginBottom: '2px'
                      }}>
                        {transacao.tipo}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#64748b'
                      }}>
                        {transacao.data} às {transacao.horario}
                      </div>
                    </div>

                    {/* Lado direito - Valor */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end'
                    }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: transacao.tipoTransacao === 'entrada' ? '#10b981' : '#1e293b'
                      }}>
                        {transacao.tipoTransacao === 'entrada' ? '+' : '-'}R$ {transacao.valor.toLocaleString('pt-BR', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Se não estiver carregando e não houver transações */}
              {transacoes.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                  Nenhuma transação encontrada para esta conta.
                </div>
              )}
            </div>
          )}
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

      {/* CSS para animação de loading */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.4; }
          100% { opacity: 0.6; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Overlay de Loading ao Clicar */}
      {isClickLoading && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2500,
            animation: 'fadeIn 0.2s ease',
            backdropFilter: 'blur(8px)',
            gap: '16px'
          }}
        >
          <div style={{
            width: '64px',
            height: '64px',
            border: '6px solid rgba(255, 255, 255, 0.2)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}></div>
          <div style={{
            color: 'white',
            fontSize: '16px',
            fontWeight: '500',
            textAlign: 'center',
            animation: 'pulse 1.5s infinite'
          }}>
            Carregando detalhes...
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Transação */}
      {isModalOpen && (
        <div 
          style={{
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
            animation: 'fadeIn 0.3s ease',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
            
              width: '90%',
              maxWidth: '500px',
              height: '90vh',
              maxHeight: '800px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              animation: 'slideUp 0.3s ease',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#2563eb',
              color: 'white',
              position: 'relative'
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                Detalhes da Transação
              </h2>
              
              {/* Botão X no canto superior direito */}
              <div 
                onClick={() => setIsModalOpen(false)}
                style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </div>
            </div>

            {/* Conteúdo Scrollável */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px'
            }}>
              {isLoadingDetails ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 20px',
                  gap: '16px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid #f1f5f9',
                    borderTopColor: '#2563eb',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <p style={{ color: '#64748b', fontSize: '14px' }}>Carregando detalhes...</p>
                </div>
              ) : selectedTransacao ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Tipo da Transação */}
                  <div style={{
                    backgroundColor: '#f8fafc',
                    padding: '16px',
                    borderRadius: '12px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                      Tipo
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>
                      {selectedTransacao.tipo === 'PIX' && 'PIX Receber'}
                      {selectedTransacao.tipo === 'PIX_RECEBIDO' && 'PIX Recebido'}
                      {selectedTransacao.tipo === 'SAQUE_CARTEIRA' && 'Saque da Carteira'}
                      {selectedTransacao.tipo === 'DEPOSITO_CARTEIRA' && 'Depósito na Carteira'}
                      {selectedTransacao.tipo === 'DELETAR_CARTEIRA' && 'Deletar Carteira'}
                      {selectedTransacao.tipo === 'CRIAR_CARTEIRA' && 'Criar Carteira'}
                      {selectedTransacao.tipo === 'SAQUE_CONTA' && 'Saque da Conta'}
                      {selectedTransacao.tipo === 'DEPOSITO_CONTA' && 'Depósito na Conta'}
                      {selectedTransacao.tipo === 'TRANSFERENCIA_INTERNA' && 'Transferência TED Interna'}
                      {selectedTransacao.tipo === 'TRANSFERENCIA_EXTERNA' && 'Transferência TED Externa'}
                      {selectedTransacao.tipo === 'PAGAMENTO_BOLETO' && 'Pagamento de Boleto'}
                      {selectedTransacao.tipo === 'PAGAMENTO_DEBITO' && 'Pagamento no Débito'}
                    </div>
                  </div>

                  {/* Valor */}
                  <div style={{
                    backgroundColor: '#f8fafc',
                    padding: '16px',
                    borderRadius: '12px'
                  }}>
                    <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                      Valor
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>
                      R$ {selectedTransacao.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Data e Hora */}
                  <div style={{
                    backgroundColor: '#f8fafc',
                    padding: '16px',
                    borderRadius: '12px'
                  }}>
                    <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                      Data e Hora
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                      {new Date(selectedTransacao.data).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })} às {new Date(selectedTransacao.data).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  {/* Campos específicos por tipo */}
                  {/* PIX / PIX_RECEBIDO */}
                  {(selectedTransacao.tipo === 'PIX' || selectedTransacao.tipo === 'PIX_RECEBIDO') && (
                    <>
                      {selectedTransacao.nomeRemetente && (
                        <div style={{
                          backgroundColor: '#f8fafc',
                          padding: '16px',
                          borderRadius: '12px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                            Nome do Remetente
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                            {selectedTransacao.nomeRemetente}
                          </div>
                        </div>
                      )}
                      {selectedTransacao.chavePixDestino && (
                        <div style={{
                          backgroundColor: '#f8fafc',
                          padding: '16px',
                          borderRadius: '12px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                            Chave PIX Destino
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                            {selectedTransacao.chavePixDestino}
                          </div>
                        </div>
                      )}
                      {selectedTransacao.nomeDestinatario && (
                        <div style={{
                          backgroundColor: '#f8fafc',
                          padding: '16px',
                          borderRadius: '12px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                            Nome do Destinatário
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                            {selectedTransacao.nomeDestinatario}
                          </div>
                        </div>
                      )}
                      {selectedTransacao.categoria && (
                        <div style={{
                          backgroundColor: '#f8fafc',
                          padding: '16px',
                          borderRadius: '12px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                            Categoria
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                            {selectedTransacao.categoria}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* TRANSFERENCIAS INTERNA/EXTERNA */}
                  {(selectedTransacao.tipo === 'TRANSFERENCIA_INTERNA' || selectedTransacao.tipo === 'TRANSFERENCIA_EXTERNA') && (
                    <>
                      {selectedTransacao.numContaOrigem && (
                        <div style={{
                          backgroundColor: '#f8fafc',
                          padding: '16px',
                          borderRadius: '12px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                            Conta Origem
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                            {selectedTransacao.numContaOrigem}
                          </div>
                        </div>
                      )}
                      {selectedTransacao.numContaDestino && (
                        <div style={{
                          backgroundColor: '#f8fafc',
                          padding: '16px',
                          borderRadius: '12px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                            Conta Destino
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                            {selectedTransacao.numContaDestino}
                          </div>
                        </div>
                      )}
                      {selectedTransacao.categoria && (
                        <div style={{
                          backgroundColor: '#f8fafc',
                          padding: '16px',
                          borderRadius: '12px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                            Categoria
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                            {selectedTransacao.categoria}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* CARTEIRA */}
                  {(selectedTransacao.tipo === 'SAQUE_CARTEIRA' || 
                    selectedTransacao.tipo === 'DEPOSITO_CARTEIRA' ||
                    selectedTransacao.tipo === 'CRIAR_CARTEIRA' ||
                    selectedTransacao.tipo === 'DELETAR_CARTEIRA') && (
                    <>
                      {selectedTransacao.nomeCarteira && (
                        <div style={{
                          backgroundColor: '#f8fafc',
                          padding: '16px',
                          borderRadius: '12px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                            Nome da Carteira
                          </div>
                          <div style={{ 
                            fontSize: '16px', 
                            fontWeight: '600', 
                            color: '#1e293b'
                          }}>
                            {selectedTransacao.nomeCarteira}
                          </div>
                        </div>
                      )}
                      {selectedTransacao.idCarteira && (
                        <div style={{
                          backgroundColor: '#f8fafc',
                          padding: '16px',
                          borderRadius: '12px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                            ID da Carteira
                          </div>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: '600', 
                            color: '#1e293b',
                            wordBreak: 'break-all'
                          }}>
                            {selectedTransacao.idCarteira}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* PAGAMENTO BOLETO */}
                  {selectedTransacao.tipo === 'PAGAMENTO_BOLETO' && (
                    <>
                      {selectedTransacao.codigoBarras && (
                        <div style={{
                          backgroundColor: '#f8fafc',
                          padding: '16px',
                          borderRadius: '12px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                            Código de Barras
                          </div>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: '600', 
                            color: '#1e293b',
                            wordBreak: 'break-all'
                          }}>
                            {selectedTransacao.codigoBarras}
                          </div>
                        </div>
                      )}
                      {selectedTransacao.nomeBeneficiario && (
                        <div style={{
                          backgroundColor: '#f8fafc',
                          padding: '16px',
                          borderRadius: '12px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                            Beneficiário
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                            {selectedTransacao.nomeBeneficiario}
                          </div>
                        </div>
                      )}
                      {selectedTransacao.instituicaoFinanceira && (
                        <div style={{
                          backgroundColor: '#f8fafc',
                          padding: '16px',
                          borderRadius: '12px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                            Instituição Financeira
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                            {selectedTransacao.instituicaoFinanceira}
                          </div>
                        </div>
                      )}
                      {selectedTransacao.dataVencimento && (
                        <div style={{
                          backgroundColor: '#f8fafc',
                          padding: '16px',
                          borderRadius: '12px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                            Data de Vencimento
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                            {new Date(selectedTransacao.dataVencimento).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      )}
                      {selectedTransacao.categoria && (
                        <div style={{
                          backgroundColor: '#f8fafc',
                          padding: '16px',
                          borderRadius: '12px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                            Categoria
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                            {selectedTransacao.categoria}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* PAGAMENTO DEBITO */}
                  {selectedTransacao.tipo === 'PAGAMENTO_DEBITO' && (
                    <>
                      {selectedTransacao.nomeEstabelecimento && (
                        <div style={{
                          backgroundColor: '#f8fafc',
                          padding: '16px',
                          borderRadius: '12px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                            Estabelecimento
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                            {selectedTransacao.nomeEstabelecimento}
                          </div>
                        </div>
                      )}
                      {selectedTransacao.categoria && (
                        <div style={{
                          backgroundColor: '#f8fafc',
                          padding: '16px',
                          borderRadius: '12px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                            Categoria
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                            {selectedTransacao.categoria}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Número da Conta (presente em todos) */}
                  {selectedTransacao.numConta && (
                    <div style={{
                      backgroundColor: '#f8fafc',
                      padding: '16px',
                      borderRadius: '12px'
                    }}>
                      <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                        Número da Conta
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                        {selectedTransacao.numConta}
                      </div>
                    </div>
                  )}

                  {/* ID da Transação */}
                  <div style={{
                    backgroundColor: '#f8fafc',
                    padding: '16px',
                    borderRadius: '12px'
                  }}>
                    <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                      ID da Transação
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: '500', 
                      color: '#64748b',
                      wordBreak: 'break-all'
                    }}>
                      {selectedTransacao.id}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                  Nenhum detalhe disponível
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Estilos para animações */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            max-height: 500px;
            transform: translateY(0);
          }
        }
        
        /* Estilo personalizado para scrollbar do dropdown de filtros */
        div[data-filter-menu] div::-webkit-scrollbar {
          width: 6px;
        }
        
        div[data-filter-menu] div::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        
        div[data-filter-menu] div::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        
        div[data-filter-menu] div::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </>
  );
};

export default Extract;
