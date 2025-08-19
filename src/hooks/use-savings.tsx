'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

export interface Poupanca {
  id: string
  user_id: string
  descricao: string
  valor_objetivo: number
  valor_atual: number
  data_objetivo: string
  categoria: string
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface CreatePoupancaData {
  descricao: string
  valor_objetivo: number
  valor_atual: number
  data_objetivo: string
  categoria: string
  observacoes?: string
}

export interface UpdatePoupancaData extends Partial<CreatePoupancaData> {
  id: string
}

export const useSavings = () => {
  const [poupancas, setPoupancas] = useState<Poupanca[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuth()
  const supabase = createClient()

  // Carregar todas as poupanças
  const loadPoupancas = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('poupanca')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setPoupancas(data || [])
    } catch (err: any) {
      console.error('Erro ao carregar poupanças:', err)
      setError(err.message || 'Erro ao carregar metas de poupança')
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // Criar nova poupança
  const createPoupanca = useCallback(async (data: CreatePoupancaData) => {
    if (!user) throw new Error('Usuário não autenticado')

    setLoading(true)
    setError(null)

    try {
      const { data: newPoupanca, error } = await supabase
        .from('poupanca')
        .insert({
          ...data,
          user_id: user.id
        })
        .select()
        .single()

      if (error) throw error

      setPoupancas(prev => [newPoupanca, ...prev])
      return newPoupanca
    } catch (err: any) {
      console.error('Erro ao criar poupança:', err)
      setError(err.message || 'Erro ao criar meta de poupança')
      throw err
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // Atualizar poupança
  const updatePoupanca = useCallback(async (id: string, data: Partial<CreatePoupancaData>) => {
    if (!user) throw new Error('Usuário não autenticado')

    setLoading(true)
    setError(null)

    try {
      const { data: updatedPoupanca, error } = await supabase
        .from('poupanca')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      setPoupancas(prev => 
        prev.map(p => p.id === id ? updatedPoupanca : p)
      )
      return updatedPoupanca
    } catch (err: any) {
      console.error('Erro ao atualizar poupança:', err)
      setError(err.message || 'Erro ao atualizar meta de poupança')
      throw err
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // Fazer contribuição
  const contribute = useCallback(async (id: string, amount: number) => {
    if (!user) throw new Error('Usuário não autenticado')
    if (amount <= 0) throw new Error('Valor deve ser positivo')

    setLoading(true)
    setError(null)

    try {
      // Buscar valor atual
      const poupanca = poupancas.find(p => p.id === id)
      if (!poupanca) throw new Error('Meta não encontrada')

      const novoValor = poupanca.valor_atual + amount

      const { data: updatedPoupanca, error } = await supabase
        .from('poupanca')
        .update({ valor_atual: novoValor })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      setPoupancas(prev => 
        prev.map(p => p.id === id ? updatedPoupanca : p)
      )
      return updatedPoupanca
    } catch (err: any) {
      console.error('Erro ao fazer contribuição:', err)
      setError(err.message || 'Erro ao fazer contribuição')
      throw err
    } finally {
      setLoading(false)
    }
  }, [user, supabase, poupancas])

  // Excluir poupança
  const deletePoupanca = useCallback(async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado')

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('poupanca')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      setPoupancas(prev => prev.filter(p => p.id !== id))
    } catch (err: any) {
      console.error('Erro ao excluir poupança:', err)
      setError(err.message || 'Erro ao excluir meta de poupança')
      throw err
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // Calcular estatísticas
  const getStatistics = useCallback(() => {
    const totalMetas = poupancas.length
    const totalObjetivo = poupancas.reduce((sum, p) => sum + p.valor_objetivo, 0)
    const totalAtual = poupancas.reduce((sum, p) => sum + p.valor_atual, 0)
    const metasCompletas = poupancas.filter(p => p.valor_atual >= p.valor_objetivo).length
    const progressoGeral = totalObjetivo > 0 ? (totalAtual / totalObjetivo) * 100 : 0

    return {
      totalMetas,
      totalObjetivo,
      totalAtual,
      metasCompletas,
      progressoGeral,
      metasAtivas: totalMetas - metasCompletas
    }
  }, [poupancas])

  // Calcular progresso de uma meta específica
  const calculateProgress = useCallback((atual: number, objetivo: number) => {
    if (objetivo <= 0) return 0
    return Math.min((atual / objetivo) * 100, 100)
  }, [])

  // Obter metas por status
  const getMetasByStatus = useCallback(() => {
    const completed = poupancas.filter(p => p.valor_atual >= p.valor_objetivo)
    const inProgress = poupancas.filter(p => p.valor_atual < p.valor_objetivo && p.valor_atual > 0)
    const notStarted = poupancas.filter(p => p.valor_atual === 0)

    return {
      completed,
      inProgress,
      notStarted
    }
  }, [poupancas])

  // Obter metas próximas do vencimento
  const getExpiringGoals = useCallback((days: number = 30) => {
    const now = new Date()
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    return poupancas.filter(p => {
      const goalDate = new Date(p.data_objetivo)
      return goalDate <= futureDate && goalDate >= now && p.valor_atual < p.valor_objetivo
    })
  }, [poupancas])

  return {
    poupancas,
    loading,
    error,
    setError,
    
    // Actions
    loadPoupancas,
    createPoupanca,
    updatePoupanca,
    contribute,
    deletePoupanca,
    
    // Utilities
    getStatistics,
    calculateProgress,
    getMetasByStatus,
    getExpiringGoals
  }
}