import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/hooks/useAuthStore'
import type { Profile, UserCategory } from '@/types'

export function useAuth() {
  const { user, loading, setUser, clear } = useAuthStore()

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        await loadProfile(session.user.id, session.user.email ?? '')
      } else {
        clear()
      }
    }
    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadProfile(session.user.id, session.user.email ?? '')
      } else {
        clear()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string, email: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, user_categories!inner(*)')
      .eq('id', userId)
      .single()

    if (profile) {
      const p = profile as Profile & { user_categories: UserCategory }
      setUser({
        id: userId,
        email,
        profile: {
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          user_category_id: p.user_category_id,
          capabilities: p.capabilities ?? [],
          phone: p.phone,
          department: p.department,
          telegram_id: p.telegram_id,
          status: p.status,
          avatar_url: p.avatar_url,
          created_at: p.created_at,
        },
        userCategory: p.user_categories ?? null,
      })
    } else {
      setUser({
        id: userId,
        email,
        profile: null,
        userCategory: null,
      })
    }
  }

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const register = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
  }

  const logout = async () => {
    await supabase.auth.signOut()
    clear()
  }

  return { user, loading, login, register, logout, loadProfile }
}
