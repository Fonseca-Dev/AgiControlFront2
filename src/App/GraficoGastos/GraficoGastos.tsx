import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoriaData {
  categoria: string;
  valor: number;
}

interface GraficoGastosProps {
  usuarioId: string;
  contaId: string;
}

// Função para gerar cores aleatórias e vibrantes para o gráfico
const getRandomColor = (index: number) => {
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
    '#E7E9ED', '#83A7D2', '#FFDDC1', '#C8A2C8', '#F4A460', '#7FFFD4'
  ];
  return colors[index % colors.length];
};

const GraficoGastos: React.FC<GraficoGastosProps> = ({ usuarioId, contaId }) => {
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!usuarioId || !contaId) return;

    const ano = new Date().getFullYear();
    const mes = new Date().getMonth() + 1; // Mês atual

    fetch(`https://sistema-gastos-694972193726.southamerica-east1.run.app/usuarios/${usuarioId}/contas/${contaId}/transacoes/categorias-mais-usadas?ano=${ano}&mes=${mes}` )
      .then(res => {
        if (!res.ok) {
          // Se a API retornar 404 (Not Found), não é um erro, apenas não há dados.
          if (res.status === 404) return { objeto: [] };
          throw new Error('Erro ao buscar dados do gráfico');
        }
        return res.json();
      })
      .then(data => {
        if (data && data.objeto && data.objeto.length > 0) {
          const labels = data.objeto.map((item: CategoriaData) => item.categoria);
          const values = data.objeto.map((item: CategoriaData) => item.valor);
          const backgroundColors = data.objeto.map((_: any, index: number) => getRandomColor(index));

          setChartData({
            labels: labels,
            datasets: [
              {
                label: 'Gastos por Categoria',
                data: values,
                backgroundColor: backgroundColors,
                borderColor: '#ffffff',
                borderWidth: 2,
              },
            ],
          });
        } else {
          // Se não houver dados, define chartData como nulo para mostrar uma mensagem
          setChartData(null);
        }
      })
      .catch(err => {
        console.error(err);
        setError('Não foi possível carregar o gráfico de gastos.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [usuarioId, contaId]);

  if (isLoading) {
    return <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Carregando gráfico...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', color: '#ffcdd2', fontSize: '14px' }}>{error}</div>;
  }

  if (!chartData) {
    return <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Sem dados de gastos para o mês atual.</div>;
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%', // Cria o efeito "donut"
    plugins: {
      legend: {
        display: false, // Vamos criar nossa própria legenda se necessário
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              const valor = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed);
              label += valor;
            }
            return label;
          }
        }
      }
    },
  };

  return (
    <div style={{ position: 'relative', width: '250px', height: '250px', margin: '0 auto' }}>
      <Doughnut data={chartData} options={options} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        {/* Ícone do Usuário Centralizado */}
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          fontWeight: 'bold',
          color: 'white',
          border: '2px solid white'
        }}>
          {localStorage.getItem("userName")?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </div>
  );
};

export default GraficoGastos;
