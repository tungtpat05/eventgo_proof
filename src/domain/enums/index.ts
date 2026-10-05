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
