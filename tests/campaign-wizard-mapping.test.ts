import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CampaignRole, CampaignStatus } from '../src/domain/enums';

describe('Campaign Wizard Mapping', () => {
  function mapCampaignMock(row: any, role: CampaignRole) {
    return {
      id: row.id,
      title: row.title,
      brandName: row.brand_name,
      description: row.description,
      companyName: row.company_name,
      companyTaxCode: row.company_tax_code,
      companyAddress: row.company_address,
      companyContactName: row.company_contact_name,
      companyContactEmail: row.company_contact_email,
      companyContactPhone: row.company_contact_phone,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      status: row.status,
      wizardStep: row.wizard_step || 1,
      createdBy: row.created_by,
      currentUserRole: role,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  test('mapCampaign đọc chính xác wizard_step từ cơ sở dữ liệu', () => {
    const rawRow = {
      id: 'camp-123',
      title: 'Chiến dịch Mùa Thu',
      brand_name: 'Brand A',
      start_date: '2026-10-01',
      end_date: '2026-10-31',
      status: CampaignStatus.DRAFT,
      wizard_step: 4,
      created_by: 'user-001',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    };

    const campaign = mapCampaignMock(rawRow, CampaignRole.MANAGER);
    assert.equal(campaign.wizardStep, 4);
    assert.equal(campaign.title, 'Chiến dịch Mùa Thu');
  });

  test('mapCampaign fallback về bước 1 nếu wizard_step là null hoặc undefined', () => {
    const rawRow = {
      id: 'camp-456',
      title: 'Chiến dịch Mới',
      brand_name: 'Brand B',
      start_date: '2026-10-01',
      end_date: '2026-10-31',
      status: CampaignStatus.DRAFT,
      wizard_step: null,
      created_by: 'user-001',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    };

    const campaign = mapCampaignMock(rawRow, CampaignRole.MANAGER);
    assert.equal(campaign.wizardStep, 1);
  });
});
