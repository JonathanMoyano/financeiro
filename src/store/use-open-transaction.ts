'use client'

import { create } from 'zustand'

interface TransactionState {
  // Estado do modal
  isOpen: boolean
  editingId: string | null
  
  // Dados da transação sendo editada/criada
  transactionData: {
    descricao: string
    valor: string
    tipo: 'receita' | 'despesa'
    categoria: string
    data: string
    observacoes: string
    metodo_pagamento: string
    recorrente: boolean
    favorito: boolean
  }
  
  // Ações
  openNew: () => void
  openEdit: (id: string, data: any) => void
  close: () => void
  updateData: (data: Partial<TransactionState['transactionData']>) => void
  reset: () => void
}

const initialTransactionData = {
  descricao: '',
  valor: '',
  tipo: 'despesa' as const,
  categoria: '',
  data: new Date().toISOString().split('T')[0],
  observacoes: '',
  metodo_pagamento: '',
  recorrente: false,
  favorito: false
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  isOpen: false,
  editingId: null,
  transactionData: initialTransactionData,
  
  openNew: () => set({
    isOpen: true,
    editingId: null,
    transactionData: initialTransactionData
  }),
  
  openEdit: (id: string, data: any) => set({
    isOpen: true,
    editingId: id,
    transactionData: {
      descricao: data.descricao || '',
      valor: data.valor?.toString() || '',
      tipo: data.tipo || 'despesa',
      categoria: data.categoria || '',
      data: data.data || new Date().toISOString().split('T')[0],
      observacoes: data.observacoes || '',
      metodo_pagamento: data.metodo_pagamento || '',
      recorrente: data.recorrente || false,
      favorito: data.favorito || false
    }
  }),
  
  close: () => set({
    isOpen: false,
    editingId: null
  }),
  
  updateData: (data) => set((state) => ({
    transactionData: { ...state.transactionData, ...data }
  })),
  
  reset: () => set({
    isOpen: false,
    editingId: null,
    transactionData: initialTransactionData
  })
}))

// Hook para facilitar o uso
export const useOpenTransaction = () => {
  const store = useTransactionStore()
  
  return {
    isOpen: store.isOpen,
    editingId: store.editingId,
    data: store.transactionData,
    
    // Ações simplificadas
    openNew: store.openNew,
    openEdit: store.openEdit,
    close: store.close,
    updateData: store.updateData,
    reset: store.reset,
    
    // Helpers
    isEditing: () => store.editingId !== null,
    getTitle: () => store.editingId ? 'Editar Transação' : 'Nova Transação',
    getSubmitText: () => store.editingId ? 'Atualizar' : 'Salvar'
  }
}