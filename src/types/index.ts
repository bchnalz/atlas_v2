export interface Profile {
  id: string
  email: string | null
  full_name: string
  user_category_id: string | null
  capabilities: string[]
  phone: string | null
  department: string | null
  telegram_id: string | null
  status: 'active' | 'inactive'
  avatar_url: string | null
  created_at: string
}

export interface UserCategory {
  id: string
  nama: string
  is_admin: boolean
}

export interface AuthUser {
  id: string
  email: string
  profile: Profile | null
  userCategory: UserCategory | null
}
