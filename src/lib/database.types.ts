export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          slug: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          slug?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          slug?: string
          created_at?: string
          updated_at?: string
        }
      }
      product_shares: {
        Row: {
          id: string
          product_id: string
          shared_with_user_id: string
          permission_level: 'read' | 'edit'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          shared_with_user_id: string
          permission_level?: 'read' | 'edit'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          shared_with_user_id?: string
          permission_level?: 'read' | 'edit'
          created_at?: string
          updated_at?: string
        }
      }
      prds: {
        Row: {
          id: string
          product_id: string
          problem: string | null
          solution: string | null
          target_audience: string | null
          tech_stack: string | null
          success_metrics: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          problem?: string | null
          solution?: string | null
          target_audience?: string | null
          tech_stack?: string | null
          success_metrics?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          problem?: string | null
          solution?: string | null
          target_audience?: string | null
          tech_stack?: string | null
          success_metrics?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      features: {
        Row: {
          id: string
          product_id: string
          name: string
          description: string | null
          priority: 'must-have' | 'nice-to-have' | 'not-prioritized',
          implementation_status: 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'deferred'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          description?: string | null
          priority?: 'must-have' | 'nice-to-have' | 'not-prioritized',
          implementation_status?: 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'deferred'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          description?: string | null
          priority?: 'must-have' | 'nice-to-have' | 'not-prioritized',
          implementation_status?: 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'deferred'
          created_at?: string
          updated_at?: string
        },
        feature_dependencies: {
          Row: {
            id: string
            feature_id: string
            depends_on_id: string
            created_at: string
          }
          Insert: {
            id?: string
            feature_id: string
            depends_on_id: string
            created_at?: string
          }
          Update: {
            id?: string
            feature_id?: string
            depends_on_id?: string
            created_at?: string
          }
        }
      }
      openai_logs: {
        Row: {
          id: string
          user_id: string
          request_type: string
          model: string
          request_payload: Json
          response_payload: Json | null
          error: string | null
          input_tokens: number | null
          output_tokens: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          request_type: string
          model: string
          request_payload: Json
          response_payload?: Json | null
          error?: string | null
          input_tokens?: number | null
          output_tokens?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          request_type?: string
          model?: string
          request_payload?: Json
          response_payload?: Json | null
          error?: string | null
          input_tokens?: number | null
          output_tokens?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_slug: {
        Args: { input_text: string }
        Returns: string
      }
      ensure_unique_slug: {
        Args: { base_slug: string; product_id?: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}