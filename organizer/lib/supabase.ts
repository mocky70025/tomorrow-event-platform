import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type OrganizerProfile = {
  id: string
  company_name: string
  lead_text?: string | null
  contact_phone?: string | null
  contact_email?: string | null
  postal_code?: string | null
  address_prefecture?: string | null
  address_city?: string | null
  address_line?: string | null
  website_url?: string | null
  is_approved: boolean
  approval_notes?: string | null
  created_at: string
  updated_at: string
}

export type OrganizerMemberRole = 'owner' | 'editor' | 'viewer'

export type OrganizerMember = {
  id: string
  organizer_profile_id: string
  line_user_id: string
  name: string
  email?: string | null
  phone_number?: string | null
  gender?: '男' | '女' | 'それ以外' | null
  age?: number | null
  role: OrganizerMemberRole
  is_primary: boolean
  created_at: string
  updated_at: string
}

export type OrganizerInvitationStatus = 'active' | 'used' | 'revoked' | 'expired'

export type OrganizerInvitation = {
  id: string
  organizer_profile_id: string
  code: string
  role: OrganizerMemberRole
  expires_at?: string | null
  used_at?: string | null
  status: OrganizerInvitationStatus
  created_by_member_id?: string | null
  created_at: string
}

export type Event = {
  id: string
  event_name: string
  event_name_furigana: string
  genre: string
  is_shizuoka_vocational_assoc_related: boolean
  opt_out_newspaper_publication: boolean
  event_start_date: string
  event_end_date: string
  event_display_period: string
  event_period_notes?: string
  event_time?: string
  application_start_date?: string
  application_end_date?: string
  application_display_period?: string
  application_notes?: string
  ticket_release_start_date?: string
  ticket_sales_location?: string
  lead_text: string
  event_description: string
  event_introduction_text?: string
  main_image_url?: string
  main_image_caption?: string
  additional_image1_url?: string
  additional_image1_caption?: string
  additional_image2_url?: string
  additional_image2_caption?: string
  additional_image3_url?: string
  additional_image3_caption?: string
  additional_image4_url?: string
  additional_image4_caption?: string
  venue_name: string
  venue_postal_code?: string
  venue_city?: string
  venue_town?: string
  venue_address?: string
  venue_latitude?: number
  venue_longitude?: number
  homepage_url?: string
  related_page_url?: string
  contact_name: string
  contact_phone: string
  contact_email?: string
  parking_info?: string
  fee_info?: string
  organizer_info?: string
  organizer_profile_id: string
  created_at: string
  updated_at: string
}
