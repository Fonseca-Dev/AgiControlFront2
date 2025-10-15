import { useState, useEffect } from 'react';

// Categorias disponíveis no sistema
export const CATEGORIAS = [
  'Alimentação',
  'Transporte',
  'Saúde',
  'Educação',
  'Lazer',
  'Moradia',
  'Vestuário',
  'Serviços',
  'Outros'
];

// Palavras-chave para sugerir categorias automaticamente
const CATEGORIA_KEYWORDS: Record<string, string[]> = {
  'Alimentação': ['mercado', 'supermercado', 'restaurante', 'lanchonete', 'padaria', 'açougue', 'hortifruti', 'delivery', 'ifood', 'uber eats', 'comida', 'alimento'],
  'Transporte': ['uber', 'taxi', 'gasolina', 'combustível', 'ônibus', 'metrô', 'passagem', 'estacionamento', '99', 'transporte', 'pedágio'],
  'Saúde': ['farmácia', 'hospital', 'clínica', 'médico', 'dentista', 'plano de saúde', 'remédio', 'consulta', 'exame', 'laboratório'],
  'Educação': ['escola', 'faculdade', 'universidade', 'curso', 'livro', 'material escolar', 'mensalidade', 'matrícula', 'tuição'],
  'Lazer': ['cinema', 'teatro', 'show', 'festa', 'viagem', 'hotel', 'streaming', 'netflix', 'spotify', 'jogo', 'entretenimento'],
  'Moradia': ['aluguel', 'condomínio', 'luz', 'água', 'gás', 'internet', 'telefone', 'iptu', 'reforma', 'manutenção'],
  'Vestuário': ['roupa', 'sapato', 'calçado', 'loja', 'moda', 'vestuário', 'boutique'],
  'Serviços': ['salão', 'barbearia', 'lavanderia', 'conserto', 'reparo', 'manutenção', 'serviço', 'profissional']
};

interface UseCategorySuggestionsReturn {
  sugestedCategory: string;
  lastUsedCategory: string | null;
  saveCategory: (category: string) => void;
  getSuggestionFromText: (text: string) => string;
}

export const useCategorySuggestions = (): UseCategorySuggestionsReturn => {
  const [lastUsedCategory, setLastUsedCategory] = useState<string | null>(null);
  const [sugestedCategory, setSugestedCategory] = useState<string>('');

  // Carrega a última categoria usada do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lastUsedCategory');
    if (saved) {
      setLastUsedCategory(saved);
    }
  }, []);

  // Salva a categoria usada
  const saveCategory = (category: string) => {
    if (category && category !== '' && CATEGORIAS.includes(category)) {
      localStorage.setItem('lastUsedCategory', category);
      setLastUsedCategory(category);
    }
  };

  // Sugere uma categoria baseada no texto fornecido
  const getSuggestionFromText = (text: string): string => {
    if (!text || text.trim() === '') return '';
    
    const lowerText = text.toLowerCase();
    
    // Procura por palavras-chave nas categorias
    for (const [categoria, keywords] of Object.entries(CATEGORIA_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          setSugestedCategory(categoria);
          return categoria;
        }
      }
    }
    
    // Se não encontrou nada, retorna a última categoria usada
    if (lastUsedCategory) {
      setSugestedCategory(lastUsedCategory);
      return lastUsedCategory;
    }
    
    return '';
  };

  return {
    sugestedCategory,
    lastUsedCategory,
    saveCategory,
    getSuggestionFromText
  };
};
