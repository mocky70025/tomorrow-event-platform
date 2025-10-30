import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Organizer = {
  id: string
  company_name: string
  name: string
  gender: string
  age: number
  phone_number: string
  email: string
  line_user_id: string
  is_approved: boolean
  created_at: string
  updated_at: string
}

export type Event = {
  id: string
  event_name: string
  event_name_furigana: string
  genre: string
  event_start_date: string
  event_end_date: string
  event_display_period: string
  lead_text: string
  event_description: string
  venue_name: string
  venue_city?: string
  main_image_url?: string
  organizer_id: string
  created_at: string
  updated_at: string
}

export type Application = {
  id: string
  application_status: 'pending' | 'approved' | 'rejected'
  applied_at: string
  exhibitor: {
    id: string
    name: string
    email: string
    phone_number: string
  }
  event: {
    id: string
    event_name: string
    event_start_date: string
    event_end_date: string
    venue_name: string
  }
}
