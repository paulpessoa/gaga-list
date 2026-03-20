// lib/constants/grocery-items.ts

export interface GrocerySuggestion {
  name: string;
  category: string;
  unit?: string;
}

export const COMMON_GROCERY_ITEMS: GrocerySuggestion[] = [
  // Açougue
  { name: 'Carne Moída', category: 'Açougue', unit: 'kg' },
  { name: 'Peito de Frango', category: 'Açougue', unit: 'kg' },
  { name: 'Bife de Alcatra', category: 'Açougue', unit: 'kg' },
  { name: 'Linguiça', category: 'Açougue', unit: 'kg' },
  
  // Hortifruti
  { name: 'Banana', category: 'Hortifruti', unit: 'kg' },
  { name: 'Maçã', category: 'Hortifruti', unit: 'kg' },
  { name: 'Tomate', category: 'Hortifruti', unit: 'kg' },
  { name: 'Cebola', category: 'Hortifruti', unit: 'kg' },
  { name: 'Alface', category: 'Hortifruti', unit: 'un' },
  { name: 'Batata', category: 'Hortifruti', unit: 'kg' },
  
  // Padaria / Matinais
  { name: 'Pão de Sal', category: 'Padaria', unit: 'un' },
  { name: 'Leite', category: 'Laticínios', unit: 'L' },
  { name: 'Café', category: 'Matinais', unit: 'un' },
  { name: 'Manteiga', category: 'Laticínios', unit: 'un' },
  { name: 'Queijo Muçarela', category: 'Laticínios', unit: 'g' },
  
  // Limpeza
  { name: 'Detergente', category: 'Limpeza', unit: 'un' },
  { name: 'Sabão em Pó', category: 'Limpeza', unit: 'un' },
  { name: 'Amaciante', category: 'Limpeza', unit: 'un' },
  { name: 'Papel Higiênico', category: 'Higiene', unit: 'un' },
  
  // Mercearia
  { name: 'Arroz', category: 'Mercearia', unit: 'kg' },
  { name: 'Feijão', category: 'Mercearia', unit: 'kg' },
  { name: 'Açúcar', category: 'Mercearia', unit: 'kg' },
  { name: 'Óleo', category: 'Mercearia', unit: 'un' },
  { name: 'Macarrão', category: 'Mercearia', unit: 'un' }
];
