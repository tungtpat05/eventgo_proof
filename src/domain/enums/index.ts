export enum CampaignRole {
  MANAGER = 'MANAGER',
  SUPERVISOR = 'SUPERVISOR',
  APPROVER = 'APPROVER',
}

export enum CampaignMemberStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
}

export enum CampaignInviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

/**
 * Lifecycle status of an activation campaign.
 */
export enum CampaignStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Verification status of an individual checklist item submission for a location.
 */
export enum SubmissionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  NEEDS_REVISION = 'NEEDS_REVISION',
  APPROVED = 'APPROVED',
}

/**
 * Review decision action taken by an Approver or PM.
 */
export enum ApprovalAction {
  APPROVE = 'APPROVE',
  REQUEST_REVISION = 'REQUEST_REVISION',
}

/**
 * Category classification for acceptance checklist items.
 */
export enum ChecklistCategory {
  STRUCTURE = 'STRUCTURE',
  BRANDING = 'BRANDING',
  POSM = 'POSM',
  STAFFING = 'STAFFING',
  CONDITION = 'CONDITION',
  OTHER = 'OTHER',
}

export enum SubscriptionPlanTier {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PRO = 'PRO',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentGatewayProvider {
  PAYOS_VIETQR = 'PAYOS_VIETQR',
  MANUAL_BANK_TRANSFER = 'MANUAL_BANK_TRANSFER',
}

export enum SystemAdminInviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REVOKED = 'REVOKED',
}
