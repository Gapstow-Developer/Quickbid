export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      settings: {
        Row: {
          id: string
          business_name: string
          business_address: string | null
          business_phone: string | null
          business_email: string | null
          primary_color: string | null
          secondary_color: string | null
          form_title: string | null
          form_subtitle: string | null
          notification_emails: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_name?: string
          business_address?: string | null
          business_phone?: string | null
          business_email?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          form_title?: string | null
          form_subtitle?: string | null
          notification_emails?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_name?: string
          business_address?: string | null
          business_phone?: string | null
          business_email?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          form_title?: string | null
          form_subtitle?: string | null
          notification_emails?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          per_sqft_price: number | null
          flat_fee: number | null
          use_both_pricing: boolean
          minimum_price: number | null
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          per_sqft_price?: number | null
          flat_fee?: number | null
          use_both_pricing?: boolean
          minimum_price?: number | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          per_sqft_price?: number | null
          flat_fee?: number | null
          use_both_pricing?: boolean
          minimum_price?: number | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      form_fields: {
        Row: {
          id: string
          field_name: string
          display_name: string
          placeholder: string | null
          is_required: boolean
          field_type: string
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          field_name: string
          display_name: string
          placeholder?: string | null
          is_required?: boolean
          field_type: string
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          field_name?: string
          display_name?: string
          placeholder?: string | null
          is_required?: boolean
          field_type?: string
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      quotes: {
        Row: {
          id: string
          customer_name: string | null
          customer_email: string | null
          customer_phone: string | null
          address: string | null
          square_footage: number | null
          stories: number | null
          service_type: string | null
          addons: string[] | null
          final_price: number | null
          status: string
          last_step_completed: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          address?: string | null
          square_footage?: number | null
          stories?: number | null
          service_type?: string | null
          addons?: string[] | null
          final_price?: number | null
          status?: string
          last_step_completed?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          address?: string | null
          square_footage?: number | null
          stories?: number | null
          service_type?: string | null
          addons?: string[] | null
          final_price?: number | null
          status?: string
          last_step_completed?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
