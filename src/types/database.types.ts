import {
  UserRole,
  CampaignStatus,
  SubmissionStatus,
  ApprovalAction,
  ChecklistCategory,
} from '@/domain/enums';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          full_name: string;
          phone: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id: string;
          email: string;
          full_name: string;
          phone?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          full_name?: string;
          phone?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          brand_name: string;
          description: string | null;
          start_date: string;
          end_date: string;
          status: CampaignStatus;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          brand_name: string;
          description?: string | null;
          start_date: string;
          end_date: string;
          status?: CampaignStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string;
          brand_name?: string;
          description?: string | null;
          start_date?: string;
          end_date?: string;
          status?: CampaignStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          campaign_id: string;
          organization_id: string;
          name: string;
          address: string;
          city: string;
          assigned_supervisor_id: string | null;
          assigned_approver_id: string | null;
          deadline: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          organization_id: string;
          name: string;
          address: string;
          city: string;
          assigned_supervisor_id?: string | null;
          assigned_approver_id?: string | null;
          deadline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          organization_id?: string;
          name?: string;
          address?: string;
          city?: string;
          assigned_supervisor_id?: string | null;
          assigned_approver_id?: string | null;
          deadline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      checklist_items: {
        Row: {
          id: string;
          campaign_id: string;
          title: string;
          description: string | null;
          category: ChecklistCategory;
          is_required: boolean;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          title: string;
          description?: string | null;
          category?: ChecklistCategory;
          is_required?: boolean;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          title?: string;
          description?: string | null;
          category?: ChecklistCategory;
          is_required?: boolean;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      submissions: {
        Row: {
          id: string;
          location_id: string;
          checklist_item_id: string;
          status: SubmissionStatus;
          notes: string | null;
          submitted_by: string | null;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          checklist_item_id: string;
          status?: SubmissionStatus;
          notes?: string | null;
          submitted_by?: string | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string;
          checklist_item_id?: string;
          status?: SubmissionStatus;
          notes?: string | null;
          submitted_by?: string | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      evidence: {
        Row: {
          id: string;
          submission_id: string;
          image_url: string;
          thumbnail_url: string | null;
          cloudinary_public_id: string;
          file_size_bytes: number | null;
          width: number | null;
          height: number | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          image_url: string;
          thumbnail_url?: string | null;
          cloudinary_public_id: string;
          file_size_bytes?: number | null;
          width?: number | null;
          height?: number | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          submission_id?: string;
          image_url?: string;
          thumbnail_url?: string | null;
          cloudinary_public_id?: string;
          file_size_bytes?: number | null;
          width?: number | null;
          height?: number | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
      };
      approval_history: {
        Row: {
          id: string;
          submission_id: string;
          reviewer_id: string;
          action: ApprovalAction;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          reviewer_id: string;
          action: ApprovalAction;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          submission_id?: string;
          reviewer_id?: string;
          action?: ApprovalAction;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
