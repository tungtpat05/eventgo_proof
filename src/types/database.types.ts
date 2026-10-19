import {
  ApprovalAction,
  CampaignInviteStatus,
  CampaignMemberStatus,
  CampaignRole,
  CampaignStatus,
  ChecklistCategory,
  SubmissionStatus,
  SubscriptionPlanTier,
  SubscriptionStatus,
  TransactionStatus,
  PaymentGatewayProvider,
  SystemAdminInviteStatus,
} from '@/domain/enums';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type TableDefinition<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: TableDefinition<
        {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          phone: string | null;
          is_system_admin: boolean;
          created_at: string;
          updated_at: string;
        },
        {
          id: string;
          email: string;
          full_name: string;
          avatar_url?: string | null;
          phone?: string | null;
          is_system_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        },
        {
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          phone?: string | null;
          is_system_admin?: boolean;
          updated_at?: string;
        }
      >;

      campaigns: TableDefinition<
        {
          id: string;
          title: string;
          brand_name: string;
          description: string | null;
          company_name: string;
          company_tax_code: string | null;
          company_address: string | null;
          company_contact_name: string | null;
          company_contact_email: string | null;
          company_contact_phone: string | null;
          start_date: string;
          end_date: string;
          status: CampaignStatus;
          wizard_step: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          title: string;
          brand_name: string;
          description?: string | null;
          company_name: string;
          company_tax_code?: string | null;
          company_address?: string | null;
          company_contact_name?: string | null;
          company_contact_email?: string | null;
          company_contact_phone?: string | null;
          start_date: string;
          end_date: string;
          status?: CampaignStatus;
          wizard_step?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          title?: string;
          brand_name?: string;
          description?: string | null;
          company_name?: string;
          company_tax_code?: string | null;
          company_address?: string | null;
          company_contact_name?: string | null;
          company_contact_email?: string | null;
          company_contact_phone?: string | null;
          start_date?: string;
          end_date?: string;
          status?: CampaignStatus;
          wizard_step?: number;
          updated_at?: string;
        }
      >;
      campaign_members: TableDefinition<
        {
          id: string;
          campaign_id: string;
          user_id: string;
          role: CampaignRole;
          status: CampaignMemberStatus;
          assigned_by: string | null;
          revoked_by: string | null;
          revoked_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          campaign_id: string;
          user_id: string;
          role: CampaignRole;
          status?: CampaignMemberStatus;
          assigned_by?: string | null;
          revoked_by?: string | null;
          revoked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          role?: CampaignRole;
          status?: CampaignMemberStatus;
          assigned_by?: string | null;
          revoked_by?: string | null;
          revoked_at?: string | null;
          updated_at?: string;
        }
      >;
      campaign_member_history: TableDefinition<
        {
          id: string;
          campaign_id: string;
          member_id: string | null;
          member_user_id: string;
          previous_role: CampaignRole | null;
          new_role: CampaignRole | null;
          previous_status: CampaignMemberStatus | null;
          new_status: CampaignMemberStatus;
          changed_by: string | null;
          created_at: string;
        },
        Record<string, never>,
        Record<string, never>
      >;
      campaign_invites: TableDefinition<
        {
          id: string;
          campaign_id: string;
          email: string;
          role: CampaignRole;
          status: CampaignInviteStatus;
          invited_by: string;
          accepted_by: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          campaign_id: string;
          email: string;
          role: CampaignRole;
          status?: CampaignInviteStatus;
          invited_by: string;
          expires_at?: string | null;
        },
        {
          role?: CampaignRole;
          status?: CampaignInviteStatus;
          accepted_by?: string | null;
          expires_at?: string | null;
        }
      >;
      locations: TableDefinition<
        {
          id: string;
          campaign_id: string;
          name: string;
          address: string;
          city: string;
          deadline: string | null;
          default_supervisor_member_id: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          campaign_id: string;
          name: string;
          address: string;
          city: string;
          deadline?: string | null;
          default_supervisor_member_id?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          name?: string;
          address?: string;
          city?: string;
          deadline?: string | null;
          default_supervisor_member_id?: string | null;
          updated_at?: string;
        }
      >;
      booths: TableDefinition<
        {
          id: string;
          location_id: string;
          name: string;
          code: string | null;
          description: string | null;
          deadline: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          location_id: string;
          name: string;
          code?: string | null;
          description?: string | null;
          deadline?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          name?: string;
          code?: string | null;
          description?: string | null;
          deadline?: string | null;
          updated_at?: string;
        }
      >;
      booth_supervisor_assignments: TableDefinition<
        {
          booth_id: string;
          supervisor_member_id: string;
          assigned_by: string;
          created_at: string;
          updated_at: string;
        },
        {
          booth_id: string;
          supervisor_member_id: string;
          assigned_by: string;
        },
        {
          supervisor_member_id?: string;
          assigned_by?: string;
          updated_at?: string;
        }
      >;
      booth_approver_assignments: TableDefinition<
        {
          booth_id: string;
          approver_member_id: string;
          assigned_by: string;
          created_at: string;
          updated_at: string;
        },
        {
          booth_id: string;
          approver_member_id: string;
          assigned_by: string;
        },
        {
          approver_member_id?: string;
          assigned_by?: string;
          updated_at?: string;
        }
      >;
      checklist_items: TableDefinition<
        {
          id: string;
          booth_id: string;
          title: string;
          description: string | null;
          category: ChecklistCategory;
          is_required: boolean;
          order_index: number;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          booth_id: string;
          title: string;
          description?: string | null;
          category?: ChecklistCategory;
          is_required?: boolean;
          order_index?: number;
        },
        {
          title?: string;
          description?: string | null;
          category?: ChecklistCategory;
          is_required?: boolean;
          order_index?: number;
        }
      >;
      submissions: TableDefinition<
        {
          id: string;
          booth_id: string;
          checklist_item_id: string;
          assigned_approver_member_id: string;
          status: SubmissionStatus;
          notes: string | null;
          submitted_by: string;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          booth_id: string;
          checklist_item_id: string;
          assigned_approver_member_id: string;
          status?: SubmissionStatus;
          notes?: string | null;
          submitted_by: string;
          submitted_at?: string | null;
        },
        {
          assigned_approver_member_id?: string;
          status?: SubmissionStatus;
          notes?: string | null;
          submitted_by?: string;
          submitted_at?: string | null;
          updated_at?: string;
        }
      >;
      evidence: TableDefinition<
        {
          id: string;
          submission_id: string;
          image_url: string;
          thumbnail_url: string | null;
          cloudinary_public_id: string;
          file_size_bytes: number | null;
          width: number | null;
          height: number | null;
          uploaded_by: string;
          created_at: string;
        },
        {
          id?: string;
          submission_id: string;
          image_url: string;
          thumbnail_url?: string | null;
          cloudinary_public_id: string;
          uploaded_by: string;
        },
        Record<string, never>
      >;
      approval_history: TableDefinition<
        {
          id: string;
          submission_id: string;
          reviewer_id: string;
          action: ApprovalAction;
          notes: string | null;
          created_at: string;
        },
        Record<string, never>,
        Record<string, never>
      >;
      subscriptions: TableDefinition<
        {
          id: string;
          user_id: string;
          plan: SubscriptionPlanTier;
          status: SubscriptionStatus;
          started_at: string;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          user_id: string;
          plan?: SubscriptionPlanTier;
          status?: SubscriptionStatus;
          started_at?: string;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          plan?: SubscriptionPlanTier;
          status?: SubscriptionStatus;
          started_at?: string;
          expires_at?: string | null;
          updated_at?: string;
        }
      >;
      system_admin_invites: TableDefinition<
        {
          id: string;
          email: string;
          invited_by: string;
          status: SystemAdminInviteStatus;
          accepted_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          email: string;
          invited_by: string;
          status?: SystemAdminInviteStatus;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          status?: SystemAdminInviteStatus;
          accepted_at?: string | null;
          updated_at?: string;
        }
      >;
      transactions: TableDefinition<
        {
          id: string;
          transaction_code: string;
          user_id: string;
          plan: SubscriptionPlanTier;
          amount: number;
          currency: string;
          provider: PaymentGatewayProvider;
          status: TransactionStatus;
          payment_url: string | null;
          qr_code_url: string | null;
          gateway_transaction_id: string | null;
          notes: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          transaction_code: string;
          user_id: string;
          plan: SubscriptionPlanTier;
          amount: number;
          currency?: string;
          provider?: PaymentGatewayProvider;
          status?: TransactionStatus;
          payment_url?: string | null;
          qr_code_url?: string | null;
          gateway_transaction_id?: string | null;
          notes?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          status?: TransactionStatus;
          payment_url?: string | null;
          qr_code_url?: string | null;
          gateway_transaction_id?: string | null;
          notes?: string | null;
          paid_at?: string | null;
          updated_at?: string;
        }
      >;
      checklist_templates: TableDefinition<
        {
          id: string;
          name: string;
          code: string;
          description: string | null;
          category: ChecklistCategory;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          name: string;
          code: string;
          description?: string | null;
          category?: ChecklistCategory;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        },
        {
          name?: string;
          code?: string;
          description?: string | null;
          category?: ChecklistCategory;
          is_active?: boolean;
          updated_at?: string;
        }
      >;
      checklist_template_items: TableDefinition<
        {
          id: string;
          template_id: string;
          title: string;
          description: string | null;
          category: ChecklistCategory;
          is_required: boolean;
          order_index: number;
          created_at: string;
        },
        {
          id?: string;
          template_id: string;
          title: string;
          description?: string | null;
          category?: ChecklistCategory;
          is_required?: boolean;
          order_index?: number;
          created_at?: string;
        },
        {
          template_id?: string;
          title?: string;
          description?: string | null;
          category?: ChecklistCategory;
          is_required?: boolean;
          order_index?: number;
        }
      >;
      subscription_plan_configs: TableDefinition<
        {
          tier: SubscriptionPlanTier;
          name: string;
          price_monthly_vnd: number;
          max_active_campaigns: number;
          max_booths: number | null;
          max_participants: number | null;
          description: string;
          features: Json;
          is_popular: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        },
        {
          tier: SubscriptionPlanTier;
          name: string;
          price_monthly_vnd?: number;
          max_active_campaigns?: number;
          max_booths?: number | null;
          max_participants?: number | null;
          description?: string;
          features?: Json;
          is_popular?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        },
        {
          name?: string;
          price_monthly_vnd?: number;
          max_active_campaigns?: number;
          max_booths?: number | null;
          max_participants?: number | null;
          description?: string;
          features?: Json;
          is_popular?: boolean;
          is_active?: boolean;
          updated_at?: string;
        }
      >;
    };

    Views: Record<string, never>;
    Functions: {
      accept_pending_admin_invites: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      accept_pending_campaign_invites: {
        Args: Record<string, never>;
        Returns: number;
      };

      create_campaign_with_manager: {
        Args: {
          p_title: string;
          p_brand_name: string;
          p_description: string;
          p_company_name: string;
          p_company_tax_code: string;
          p_company_address: string;
          p_company_contact_name: string;
          p_company_contact_email: string;
          p_company_contact_phone: string;
          p_start_date: string;
          p_end_date: string;
          p_status: CampaignStatus;
        };
        Returns: string;
      };
      invite_campaign_member: {
        Args: { p_campaign_id: string; p_email: string; p_role: CampaignRole };
        Returns: string;
      };
      set_campaign_member_access: {
        Args: { p_member_id: string; p_role: CampaignRole; p_revoke?: boolean };
        Returns: undefined;
      };
      assign_booth_personnel: {
        Args: {
          p_booth_id: string;
          p_supervisor_member_id: string | null;
          p_approver_member_id: string | null;
          p_deadline?: string | null;
        };
        Returns: undefined;
      };
      submit_evidence: {
        Args: {
          p_booth_id: string;
          p_checklist_item_id: string;
          p_notes: string;
          p_photos: Json;
        };
        Returns: string;
      };
      assign_submission_approver: {
        Args: { p_submission_id: string; p_approver_member_id: string };
        Returns: undefined;
      };
      review_submission: {
        Args: { p_submission_id: string; p_action: ApprovalAction; p_notes: string };
        Returns: undefined;
      };
      check_campaign_activation_readiness: {
        Args: { p_campaign_id: string };
        Returns: {
          can_activate: boolean;
          errors: string[];
        };
      };
      is_campaign_manager: {
        Args: { target_campaign_id: string };
        Returns: boolean;
      };
      is_booth_supervisor: {
        Args: { target_booth_id: string };
        Returns: boolean;
      };
      is_booth_approver: {
        Args: { target_booth_id: string };
        Returns: boolean;
      };
      is_submission_approver: {
        Args: { target_submission_id: string };
        Returns: boolean;
      };
      can_access_campaign: {
        Args: { target_campaign_id: string };
        Returns: boolean;
      };
      can_access_location: {
        Args: { target_location_id: string };
        Returns: boolean;
      };
      can_access_booth: {
        Args: { target_booth_id: string };
        Returns: boolean;
      };
      can_access_submission: {
        Args: { target_submission_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      campaign_role: CampaignRole;
      campaign_member_status: CampaignMemberStatus;
      campaign_invite_status: CampaignInviteStatus;
      campaign_status: CampaignStatus;
      submission_status: SubmissionStatus;
      approval_action: ApprovalAction;
      checklist_category: ChecklistCategory;
    };
  };
}

