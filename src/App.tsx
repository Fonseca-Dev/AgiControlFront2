import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import Home from './App/Home/Home';
import Login from './App/Login/Login';
import Signup from './App/Signup/Signup';
import Extract from './App/Extract/Extract';
import DetalheTransacao from './App/DetalheTransacao/DetalheTransacao.tsx';
import CarteiraControleGastos from './App/CarteiraControleGastos/CarteiraControleGastos';
import NovaCarteira from './App/NovaCarteira/NovaCarteira';
import EditarCarteira from './App/EditarCarteira/EditarCarteira';
import { SaldoProvider } from './contexts/SaldoContext';
import { TransacaoProvider } from './contexts/TransacaoContext';
import { TipoTransacaoProvider } from './contexts/TipoTransacaoContext';
import { CarteiraProvider } from './contexts/CarteiraContext';
import './App.css';

// Importação dos componentes existentes
import Transferencia from './App/Transferencia/Transferencia'; 
import Transacoes from './App/Transacoes/Transacoes';
import Perfil from './App/Perfil/Perfil';

// ===================================================================
// 1. IMPORTAÇÃO DOS NOVOS COMPONENTES DE TRANSAÇÃO
// (Ajuste o caminho se você salvou os arquivos em outro lugar)
// ===================================================================
import PagamentoDebito from './App/PagamentoDebito/PagamentoDebito';
import TransferenciaPix from './App/TransferenciaPix/TransferenciaPix';
import PagamentoBoleto from './App/PagamentoBoleto/PagamentoBoleto';

// Componente wrapper para adicionar animações de transição
function AnimatedRoutes() {
  return (
    <div className="page-transition">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/extrato" element={<Extract />} />
        
        <Route path="/transferencia" element={<Transferencia />} />
        <Route path="/transacoes" element={<Transacoes />} />
        <Route path="/perfil" element={<Perfil />} />
        
        {/* =================================================================== */}
        {/* 2. ADIÇÃO DAS NOVAS ROTAS PARA CADA TELA DE TRANSAÇÃO            */}
        {/* =================================================================== */}
        <Route path="/pagamento-debito" element={<PagamentoDebito />} />
        <Route path="/transferencia-pix" element={<TransferenciaPix />} />
        <Route path="/pagamento-boleto" element={<PagamentoBoleto />} />

        <Route path="/carteira" element={<CarteiraControleGastos />} />
        <Route path="/nova-carteira" element={<NovaCarteira />} />
        <Route path="/editar-carteira/:id" element={<EditarCarteira />} />
        <Route path="/transacao/:id" element={<DetalheTransacao />} />
      </Routes>
    </div>
  );
}


function App() {
  return (
    <div className="app-container">
      <MantineProvider>
        <SaldoProvider>
          <TransacaoProvider>
            <TipoTransacaoProvider>
              <CarteiraProvider>
                <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                  <AnimatedRoutes />
                </Router>
              </CarteiraProvider>
            </TipoTransacaoProvider>
          </TransacaoProvider>
        </SaldoProvider>
      </MantineProvider>
    </div>
  );
}

export default App;
