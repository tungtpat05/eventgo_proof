import {
  CampaignRole,
  SubmissionStatus,
  CampaignStatus,
  CampaignMemberStatus,
  CampaignInviteStatus,
  ChecklistCategory,
} from '@/domain/enums';

type TranslateFn = (key: string) => string;

export function getRoleLabel(role: CampaignRole, t: TranslateFn): string {
  switch (role) {
    case CampaignRole.MANAGER:
      return t('roles.MANAGER');
    case CampaignRole.SUPERVISOR:
      return t('roles.SUPERVISOR');
    case CampaignRole.APPROVER:
      return t('roles.APPROVER');
    default:
      return role;
  }
}

export function getSubmissionStatusLabel(status: SubmissionStatus, t: TranslateFn): string {
  switch (status) {
    case SubmissionStatus.DRAFT:
      return t('submissionStatus.DRAFT');
    case SubmissionStatus.SUBMITTED:
      return t('submissionStatus.SUBMITTED');
    case SubmissionStatus.NEEDS_REVISION:
      return t('submissionStatus.NEEDS_REVISION');
    case SubmissionStatus.APPROVED:
      return t('submissionStatus.APPROVED');
    default:
      return status;
  }
}

export function getCampaignStatusLabel(status: CampaignStatus, t: TranslateFn): string {
  switch (status) {
    case CampaignStatus.DRAFT:
      return t('campaignStatus.DRAFT');
    case CampaignStatus.ACTIVE:
      return t('campaignStatus.ACTIVE');
    case CampaignStatus.COMPLETED:
      return t('campaignStatus.COMPLETED');
    case CampaignStatus.ARCHIVED:
      return t('campaignStatus.ARCHIVED');
    default:
      return status;
  }
}

export function getMemberStatusLabel(status: CampaignMemberStatus, t: TranslateFn): string {
  switch (status) {
    case CampaignMemberStatus.ACTIVE:
      return t('memberStatus.ACTIVE');
    case CampaignMemberStatus.REVOKED:
      return t('memberStatus.REVOKED');
    default:
      return status;
  }
}

export function getInviteStatusLabel(status: CampaignInviteStatus, t: TranslateFn): string {
  switch (status) {
    case CampaignInviteStatus.PENDING:
      return t('inviteStatus.PENDING');
    case CampaignInviteStatus.ACCEPTED:
      return t('inviteStatus.ACCEPTED');
    case CampaignInviteStatus.REVOKED:
      return t('inviteStatus.REVOKED');
    case CampaignInviteStatus.EXPIRED:
      return t('inviteStatus.EXPIRED');
    default:
      return status;
  }
}

export function getChecklistCategoryLabel(category: ChecklistCategory, t: TranslateFn): string {
  switch (category) {
    case ChecklistCategory.STRUCTURE:
      return t('checklistCategory.STRUCTURE');
    case ChecklistCategory.BRANDING:
      return t('checklistCategory.BRANDING');
    case ChecklistCategory.POSM:
      return t('checklistCategory.POSM');
    case ChecklistCategory.STAFFING:
      return t('checklistCategory.STAFFING');
    case ChecklistCategory.CONDITION:
      return t('checklistCategory.CONDITION');
    case ChecklistCategory.OTHER:
      return t('checklistCategory.OTHER');
    default:
      return category;
  }
}
