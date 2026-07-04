export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_ip_hashes: {
        Row: {
          added_by: string | null
          created_at: string
          id: string
          ip_hash: string
          label: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          id?: string
          ip_hash: string
          label?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string
          id?: string
          ip_hash?: string
          label?: string | null
        }
        Relationships: []
      }
      assedio_sexual_responses: {
        Row: {
          access_code_hash: string | null
          age_range: string | null
          answers: Json
          company_id: string
          created_at: string
          department: string | null
          gender: string | null
          id: string
          latencies_ms: Json
          participant_token_hash: string
          round_no: number
          scores: Json | null
          tenure_range: string | null
          updated_at: string
        }
        Insert: {
          access_code_hash?: string | null
          age_range?: string | null
          answers: Json
          company_id: string
          created_at?: string
          department?: string | null
          gender?: string | null
          id?: string
          latencies_ms: Json
          participant_token_hash: string
          round_no?: number
          scores?: Json | null
          tenure_range?: string | null
          updated_at?: string
        }
        Update: {
          access_code_hash?: string | null
          age_range?: string | null
          answers?: Json
          company_id?: string
          created_at?: string
          department?: string | null
          gender?: string | null
          id?: string
          latencies_ms?: Json
          participant_token_hash?: string
          round_no?: number
          scores?: Json | null
          tenure_range?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assedio_sexual_responses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      care_platforms: {
        Row: {
          active: boolean
          country: string
          created_at: string
          description: string | null
          id: string
          name: string
          phone: string | null
          type: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          active?: boolean
          country: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          phone?: string | null
          type?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          active?: boolean
          country?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          phone?: string | null
          type?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          allowed_versions: string[]
          approved_at: string | null
          cnpj: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          contact_role: string | null
          created_at: string
          default_version: string
          id: string
          name: string
          notes: string | null
          owner_user_id: string
          sector: string | null
          size_range: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          allowed_versions?: string[]
          approved_at?: string | null
          cnpj?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          contact_role?: string | null
          created_at?: string
          default_version?: string
          id?: string
          name: string
          notes?: string | null
          owner_user_id: string
          sector?: string | null
          size_range?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          allowed_versions?: string[]
          approved_at?: string | null
          cnpj?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          contact_role?: string | null
          created_at?: string
          default_version?: string
          id?: string
          name?: string
          notes?: string | null
          owner_user_id?: string
          sector?: string | null
          size_range?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      copsoq_company_notes: {
        Row: {
          company_id: string
          created_at: string
          notes: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          notes?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          notes?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "copsoq_company_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      copsoq_question_overrides: {
        Row: {
          active: boolean
          created_at: string
          id: string
          n: number
          text_override: string
          updated_at: string
          version: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          n: number
          text_override: string
          updated_at?: string
          version: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          n?: number
          text_override?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      copsoq_report_template: {
        Row: {
          blocks: Json
          id: number
          updated_at: string
        }
        Insert: {
          blocks?: Json
          id?: number
          updated_at?: string
        }
        Update: {
          blocks?: Json
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      copsoq_responses: {
        Row: {
          access_code_hash: string | null
          age_range: string | null
          answers: Json
          city: string | null
          company_id: string
          country: string | null
          created_at: string
          department: string | null
          gender: string | null
          id: string
          ip_hash: string | null
          latencies_ms: Json | null
          participant_token_hash: string | null
          region: string | null
          round_no: number | null
          scores: Json | null
          social_desirability_score: number | null
          tenure_range: string | null
          user_agent: string | null
          version: string
        }
        Insert: {
          access_code_hash?: string | null
          age_range?: string | null
          answers: Json
          city?: string | null
          company_id: string
          country?: string | null
          created_at?: string
          department?: string | null
          gender?: string | null
          id?: string
          ip_hash?: string | null
          latencies_ms?: Json | null
          participant_token_hash?: string | null
          region?: string | null
          round_no?: number | null
          scores?: Json | null
          social_desirability_score?: number | null
          tenure_range?: string | null
          user_agent?: string | null
          version: string
        }
        Update: {
          access_code_hash?: string | null
          age_range?: string | null
          answers?: Json
          city?: string | null
          company_id?: string
          country?: string | null
          created_at?: string
          department?: string | null
          gender?: string | null
          id?: string
          ip_hash?: string | null
          latencies_ms?: Json | null
          participant_token_hash?: string | null
          region?: string | null
          round_no?: number | null
          scores?: Json | null
          social_desirability_score?: number | null
          tenure_range?: string | null
          user_agent?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "copsoq_responses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ecig_responses: {
        Row: {
          access_code_hash: string | null
          age_range: string | null
          answers: Json
          company_id: string
          created_at: string
          department: string | null
          gender: string | null
          id: string
          latencies_ms: Json
          participant_token_hash: string
          round_no: number | null
          scores: Json | null
          tenure_range: string | null
        }
        Insert: {
          access_code_hash?: string | null
          age_range?: string | null
          answers: Json
          company_id: string
          created_at?: string
          department?: string | null
          gender?: string | null
          id?: string
          latencies_ms: Json
          participant_token_hash: string
          round_no?: number | null
          scores?: Json | null
          tenure_range?: string | null
        }
        Update: {
          access_code_hash?: string | null
          age_range?: string | null
          answers?: Json
          company_id?: string
          created_at?: string
          department?: string | null
          gender?: string | null
          id?: string
          latencies_ms?: Json
          participant_token_hash?: string
          round_no?: number | null
          scores?: Json | null
          tenure_range?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ecig_responses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      edge_rate_limits: {
        Row: {
          count: number
          created_at: string
          endpoint: string
          id: string
          ip_hash: string
          window_start: string
        }
        Insert: {
          count?: number
          created_at?: string
          endpoint: string
          id?: string
          ip_hash: string
          window_start?: string
        }
        Update: {
          count?: number
          created_at?: string
          endpoint?: string
          id?: string
          ip_hash?: string
          window_start?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: string
          message: string
          region: string | null
          score: number | null
          severity: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          message: string
          region?: string | null
          score?: number | null
          severity?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          message?: string
          region?: string | null
          score?: number | null
          severity?: string | null
        }
        Relationships: []
      }
      gad7_company_responses: {
        Row: {
          access_code_hash: string | null
          age: number | null
          age_range: string | null
          answers: Json
          company_id: string
          created_at: string
          department: string | null
          gender: string | null
          id: string
          latencies_ms: Json | null
          participant_token_hash: string
          round_no: number
          score: number
          severity: string
          tenure_range: string | null
          updated_at: string
        }
        Insert: {
          access_code_hash?: string | null
          age?: number | null
          age_range?: string | null
          answers: Json
          company_id: string
          created_at?: string
          department?: string | null
          gender?: string | null
          id?: string
          latencies_ms?: Json | null
          participant_token_hash: string
          round_no?: number
          score: number
          severity: string
          tenure_range?: string | null
          updated_at?: string
        }
        Update: {
          access_code_hash?: string | null
          age?: number | null
          age_range?: string | null
          answers?: Json
          company_id?: string
          created_at?: string
          department?: string | null
          gender?: string | null
          id?: string
          latencies_ms?: Json | null
          participant_token_hash?: string
          round_no?: number
          score?: number
          severity?: string
          tenure_range?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gad7_company_responses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      individual_report_templates: {
        Row: {
          body: string | null
          created_at: string
          enabled: boolean
          id: string
          metadata: Json
          position: number
          section_key: string
          severity: string
          title: string | null
          updated_at: string
          wave: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          metadata?: Json
          position?: number
          section_key: string
          severity?: string
          title?: string | null
          updated_at?: string
          wave: string
        }
        Update: {
          body?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          metadata?: Json
          position?: number
          section_key?: string
          severity?: string
          title?: string | null
          updated_at?: string
          wave?: string
        }
        Relationships: []
      }
      instrument_questions: {
        Row: {
          active: boolean
          created_at: string
          id: string
          instrument: string
          meta: Json | null
          n: number
          response_set: string | null
          reverse: boolean
          scale: string | null
          text: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          instrument: string
          meta?: Json | null
          n: number
          response_set?: string | null
          reverse?: boolean
          scale?: string | null
          text: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          instrument?: string
          meta?: Json | null
          n?: number
          response_set?: string | null
          reverse?: boolean
          scale?: string | null
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      link_clicks: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: string
          ip_hash: string | null
          landing_path: string | null
          link_type: string
          referrer: string | null
          region: string | null
          target_id: string | null
          target_label: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          landing_path?: string | null
          link_type: string
          referrer?: string | null
          region?: string | null
          target_id?: string | null
          target_label?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          landing_path?: string | null
          link_type?: string
          referrer?: string | null
          region?: string | null
          target_id?: string | null
          target_label?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      phq9_company_responses: {
        Row: {
          access_code_hash: string | null
          age: number | null
          age_range: string | null
          answers: Json
          company_id: string
          created_at: string
          department: string | null
          functional_impact: number | null
          gender: string | null
          id: string
          is_retest: boolean
          latencies_ms: Json
          participant_token_hash: string
          round_no: number | null
          score: number | null
          severity: string | null
          symptoms: string[] | null
          tenure_range: string | null
        }
        Insert: {
          access_code_hash?: string | null
          age?: number | null
          age_range?: string | null
          answers: Json
          company_id: string
          created_at?: string
          department?: string | null
          functional_impact?: number | null
          gender?: string | null
          id?: string
          is_retest?: boolean
          latencies_ms: Json
          participant_token_hash: string
          round_no?: number | null
          score?: number | null
          severity?: string | null
          symptoms?: string[] | null
          tenure_range?: string | null
        }
        Update: {
          access_code_hash?: string | null
          age?: number | null
          age_range?: string | null
          answers?: Json
          company_id?: string
          created_at?: string
          department?: string | null
          functional_impact?: number | null
          gender?: string | null
          id?: string
          is_retest?: boolean
          latencies_ms?: Json
          participant_token_hash?: string
          round_no?: number | null
          score?: number | null
          severity?: string | null
          symptoms?: string[] | null
          tenure_range?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phq9_company_responses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          active: boolean
          bio: string | null
          city: string
          contact: string | null
          country: string
          created_at: string
          id: string
          modality: string
          name: string
          price_from: string | null
          specialty: string
          title: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          active?: boolean
          bio?: string | null
          city: string
          contact?: string | null
          country?: string
          created_at?: string
          id?: string
          modality: string
          name: string
          price_from?: string | null
          specialty: string
          title: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          active?: boolean
          bio?: string | null
          city?: string
          contact?: string | null
          country?: string
          created_at?: string
          id?: string
          modality?: string
          name?: string
          price_from?: string | null
          specialty?: string
          title?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      psicossocial_responses: {
        Row: {
          access_code_hash: string | null
          age_range: string | null
          answers: Json
          city: string | null
          company_id: string
          country: string | null
          created_at: string
          department: string | null
          gender: string | null
          id: string
          instrument: string
          ip_hash: string | null
          latencies_ms: Json
          participant_token_hash: string
          region: string | null
          round_no: number | null
          scores: Json | null
          tenure_range: string | null
          user_agent: string | null
        }
        Insert: {
          access_code_hash?: string | null
          age_range?: string | null
          answers: Json
          city?: string | null
          company_id: string
          country?: string | null
          created_at?: string
          department?: string | null
          gender?: string | null
          id?: string
          instrument?: string
          ip_hash?: string | null
          latencies_ms: Json
          participant_token_hash: string
          region?: string | null
          round_no?: number | null
          scores?: Json | null
          tenure_range?: string | null
          user_agent?: string | null
        }
        Update: {
          access_code_hash?: string | null
          age_range?: string | null
          answers?: Json
          city?: string | null
          company_id?: string
          country?: string | null
          created_at?: string
          department?: string | null
          gender?: string | null
          id?: string
          instrument?: string
          ip_hash?: string | null
          latencies_ms?: Json
          participant_token_hash?: string
          region?: string | null
          round_no?: number | null
          scores?: Json | null
          tenure_range?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      retest_reminders: {
        Row: {
          created_at: string
          email: string
          error_message: string | null
          id: string
          scheduled_at: string
          sent_at: string | null
          severity: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          error_message?: string | null
          id?: string
          scheduled_at: string
          sent_at?: string | null
          severity?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          error_message?: string | null
          id?: string
          scheduled_at?: string
          sent_at?: string | null
          severity?: string | null
          status?: string
        }
        Relationships: []
      }
      rorschach_images: {
        Row: {
          active: boolean
          created_at: string
          id: string
          label: string
          notes: string | null
          sort_order: number
          storage_path: string | null
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          label: string
          notes?: string | null
          sort_order?: number
          storage_path?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          label?: string
          notes?: string | null
          sort_order?: number
          storage_path?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      rorschach_responses: {
        Row: {
          age_range: string | null
          analyst_notes: string | null
          company_id: string
          created_at: string
          department: string | null
          gender: string | null
          id: string
          image_id: string | null
          narrative: string
          participant_token_hash: string
          round_no: number
          scores: Json | null
          started_at: string | null
          submitted_at: string
          tenure_range: string | null
          time_ms: number
          updated_at: string
        }
        Insert: {
          age_range?: string | null
          analyst_notes?: string | null
          company_id: string
          created_at?: string
          department?: string | null
          gender?: string | null
          id?: string
          image_id?: string | null
          narrative: string
          participant_token_hash: string
          round_no?: number
          scores?: Json | null
          started_at?: string | null
          submitted_at?: string
          tenure_range?: string | null
          time_ms?: number
          updated_at?: string
        }
        Update: {
          age_range?: string | null
          analyst_notes?: string | null
          company_id?: string
          created_at?: string
          department?: string | null
          gender?: string | null
          id?: string
          image_id?: string | null
          narrative?: string
          participant_token_hash?: string
          round_no?: number
          scores?: Json | null
          started_at?: string | null
          submitted_at?: string
          tenure_range?: string | null
          time_ms?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rorschach_responses_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "rorschach_images"
            referencedColumns: ["id"]
          },
        ]
      }
      sample_report_leads: {
        Row: {
          age: number | null
          company: string
          created_at: string
          email: string
          id: string
          name: string | null
          notes: string | null
          phone: string
          referrer: string | null
          role: string
          status: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          age?: number | null
          company: string
          created_at?: string
          email: string
          id?: string
          name?: string | null
          notes?: string | null
          phone: string
          referrer?: string | null
          role: string
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          age?: number | null
          company?: string
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string
          referrer?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          city: string | null
          country: string | null
          id: string
          ip_hash: string | null
          landing_path: string | null
          last_seen_at: string
          referrer: string | null
          region: string | null
          session_id: string
          started_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          id?: string
          ip_hash?: string | null
          landing_path?: string | null
          last_seen_at?: string
          referrer?: string | null
          region?: string | null
          session_id: string
          started_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          id?: string
          ip_hash?: string | null
          landing_path?: string | null
          last_seen_at?: string
          referrer?: string | null
          region?: string | null
          session_id?: string
          started_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      severity_articles: {
        Row: {
          active: boolean
          created_at: string
          id: string
          label: string
          severity: string
          source: string | null
          summary: string | null
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          label: string
          severity: string
          source?: string | null
          summary?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          label?: string
          severity?: string
          source?: string | null
          summary?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          message: string
          metadata: Json | null
          resolved: boolean
          severity: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          resolved?: boolean
          severity?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          resolved?: boolean
          severity?: string
        }
        Relationships: []
      }
      tat_images: {
        Row: {
          active: boolean
          created_at: string
          id: string
          label: string
          notes: string | null
          sort_order: number
          storage_path: string | null
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          label: string
          notes?: string | null
          sort_order?: number
          storage_path?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          label?: string
          notes?: string | null
          sort_order?: number
          storage_path?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      tat_public_requests: {
        Row: {
          age: number | null
          created_at: string
          email: string
          id: string
          notes: string | null
          phq9_score: number | null
          response_token: string | null
          sent_at: string | null
          severity_level: string | null
          status: string
          symptom_count: number | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          email: string
          id?: string
          notes?: string | null
          phq9_score?: number | null
          response_token?: string | null
          sent_at?: string | null
          severity_level?: string | null
          status?: string
          symptom_count?: number | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          created_at?: string
          email?: string
          id?: string
          notes?: string | null
          phq9_score?: number | null
          response_token?: string | null
          sent_at?: string | null
          severity_level?: string | null
          status?: string
          symptom_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      tat_public_responses: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          image_id: string | null
          narrative: string
          parameters: Json
          request_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          scores: Json
          status: string
          time_ms: number | null
          updated_at: string
          user_agent: string | null
          word_count: number | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          image_id?: string | null
          narrative: string
          parameters?: Json
          request_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scores?: Json
          status?: string
          time_ms?: number | null
          updated_at?: string
          user_agent?: string | null
          word_count?: number | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          image_id?: string | null
          narrative?: string
          parameters?: Json
          request_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scores?: Json
          status?: string
          time_ms?: number | null
          updated_at?: string
          user_agent?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tat_public_responses_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "tat_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tat_public_responses_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "tat_public_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      tat_responses: {
        Row: {
          age_range: string | null
          analyst_notes: string | null
          company_id: string
          created_at: string
          department: string | null
          gender: string | null
          id: string
          image_id: string | null
          narrative: string
          participant_token_hash: string
          round_no: number
          scores: Json | null
          started_at: string | null
          submitted_at: string
          tenure_range: string | null
          time_ms: number
          updated_at: string
        }
        Insert: {
          age_range?: string | null
          analyst_notes?: string | null
          company_id: string
          created_at?: string
          department?: string | null
          gender?: string | null
          id?: string
          image_id?: string | null
          narrative: string
          participant_token_hash: string
          round_no?: number
          scores?: Json | null
          started_at?: string | null
          submitted_at?: string
          tenure_range?: string | null
          time_ms?: number
          updated_at?: string
        }
        Update: {
          age_range?: string | null
          analyst_notes?: string | null
          company_id?: string
          created_at?: string
          department?: string | null
          gender?: string | null
          id?: string
          image_id?: string | null
          narrative?: string
          participant_token_hash?: string
          round_no?: number
          scores?: Json | null
          started_at?: string | null
          submitted_at?: string
          tenure_range?: string | null
          time_ms?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tat_responses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tat_responses_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "tat_images"
            referencedColumns: ["id"]
          },
        ]
      }
      test_events: {
        Row: {
          age: number | null
          city: string | null
          country: string | null
          created_at: string
          functional_impact: number | null
          id: string
          ip_hash: string | null
          landing_path: string | null
          phq9_answers: number[] | null
          phq9_latencies_ms: number[] | null
          referrer: string | null
          region: string | null
          score: number | null
          severity: string | null
          symptoms: string[] | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          age?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          functional_impact?: number | null
          id?: string
          ip_hash?: string | null
          landing_path?: string | null
          phq9_answers?: number[] | null
          phq9_latencies_ms?: number[] | null
          referrer?: string | null
          region?: string | null
          score?: number | null
          severity?: string | null
          symptoms?: string[] | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          age?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          functional_impact?: number | null
          id?: string
          ip_hash?: string | null
          landing_path?: string | null
          phq9_answers?: number[] | null
          phq9_latencies_ms?: number[] | null
          referrer?: string | null
          region?: string | null
          score?: number | null
          severity?: string | null
          symptoms?: string[] | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wellness_company_rounds: {
        Row: {
          closed_at: string | null
          company_id: string
          created_at: string
          devolutiva_communicated_at: string | null
          devolutiva_notes: string | null
          id: string
          opened_at: string
          round_no: number
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          company_id: string
          created_at?: string
          devolutiva_communicated_at?: string | null
          devolutiva_notes?: string | null
          id?: string
          opened_at?: string
          round_no: number
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          company_id?: string
          created_at?: string
          devolutiva_communicated_at?: string | null
          devolutiva_notes?: string | null
          id?: string
          opened_at?: string
          round_no?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_company_rounds_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_company_settings: {
        Row: {
          cadence_auto_open: boolean
          cadence_months: number
          company_id: string
          created_at: string
          min_recorte_company: number
          min_recorte_department: number
          n_min_cfa: number
          n_min_dif: number
          n_min_invariance: number
          reminder_days: number[]
          signal_max_days_since_devolutiva: number
          signal_min_adherence_pct: number
          signals_enabled: boolean
          updated_at: string
        }
        Insert: {
          cadence_auto_open?: boolean
          cadence_months?: number
          company_id: string
          created_at?: string
          min_recorte_company?: number
          min_recorte_department?: number
          n_min_cfa?: number
          n_min_dif?: number
          n_min_invariance?: number
          reminder_days?: number[]
          signal_max_days_since_devolutiva?: number
          signal_min_adherence_pct?: number
          signals_enabled?: boolean
          updated_at?: string
        }
        Update: {
          cadence_auto_open?: boolean
          cadence_months?: number
          company_id?: string
          created_at?: string
          min_recorte_company?: number
          min_recorte_department?: number
          n_min_cfa?: number
          n_min_dif?: number
          n_min_invariance?: number
          reminder_days?: number[]
          signal_max_days_since_devolutiva?: number
          signal_min_adherence_pct?: number
          signals_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      wellness_editable_texts: {
        Row: {
          content: string
          created_at: string
          id: string
          key: string
          label: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          key: string
          label: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          key?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      wellness_invitations: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          id: string
          last_error: string | null
          last_reminder_at: string | null
          opened_at: string | null
          participant_id: string
          reminder_count: number
          round_no: number
          scheduled_at: string
          sent_at: string | null
          status: string
          wave: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          last_reminder_at?: string | null
          opened_at?: string | null
          participant_id: string
          reminder_count?: number
          round_no?: number
          scheduled_at: string
          sent_at?: string | null
          status?: string
          wave: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          last_reminder_at?: string | null
          opened_at?: string | null
          participant_id?: string
          reminder_count?: number
          round_no?: number
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          wave?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_invitations_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "wellness_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_participants: {
        Row: {
          access_code_first_used_at: string | null
          access_code_hash: string | null
          access_code_issued_at: string | null
          company_id: string
          created_at: string
          email: string
          enrolled_at: string
          id: string
          longitudinal_hash: string | null
          token: string
          token_hash: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          access_code_first_used_at?: string | null
          access_code_hash?: string | null
          access_code_issued_at?: string | null
          company_id: string
          created_at?: string
          email: string
          enrolled_at?: string
          id?: string
          longitudinal_hash?: string | null
          token?: string
          token_hash?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          access_code_first_used_at?: string | null
          access_code_hash?: string | null
          access_code_issued_at?: string | null
          company_id?: string
          created_at?: string
          email?: string
          enrolled_at?: string
          id?: string
          longitudinal_hash?: string | null
          token?: string
          token_hash?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wellness_participants_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_psychometrics_runs: {
        Row: {
          bias_metrics: Json | null
          company_id: string
          computed_at: string | null
          created_at: string
          error_msg: string | null
          fit_indices: Json | null
          id: string
          instrument: string
          invariance: Json | null
          n_used: number
          round_no: number
          status: string
          updated_at: string
        }
        Insert: {
          bias_metrics?: Json | null
          company_id: string
          computed_at?: string | null
          created_at?: string
          error_msg?: string | null
          fit_indices?: Json | null
          id?: string
          instrument: string
          invariance?: Json | null
          n_used?: number
          round_no: number
          status?: string
          updated_at?: string
        }
        Update: {
          bias_metrics?: Json | null
          company_id?: string
          computed_at?: string | null
          created_at?: string
          error_msg?: string | null
          fit_indices?: Json | null
          id?: string
          instrument?: string
          invariance?: Json | null
          n_used?: number
          round_no?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_psychometrics_runs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user" | "viewer" | "company"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "viewer", "company"],
    },
  },
} as const
