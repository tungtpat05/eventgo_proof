import test from 'node:test';
import assert from 'node:assert/strict';
import { CampaignRole } from '../src/domain/enums';
import {
  renderAdminInviteEmailHtml,
  renderCampaignInviteEmailHtml,
} from '../src/infrastructure/services/email-service';

test('renderAdminInviteEmailHtml renders a stacked bilingual layout', () => {
  const html = renderAdminInviteEmailHtml({
    to: 'admin@eventgo.vn',
    inviterName: 'CEO Nguyen',
    inviteLink: 'https://proof.eventgo.vn/auth/invite?email=admin%40eventgo.vn&type=admin',
  });

  // Contains both English and Vietnamese sections
  assert.ok(html.includes('System Administrator Invitation'), 'Should have EN title');
  assert.ok(html.includes('Lời mời tham gia Quản Trị Viên Hệ Thống'), 'Should have VI title');

  // Contains inviter, email and link
  assert.ok(html.includes('CEO Nguyen'), 'Should display inviter name');
  assert.ok(html.includes('admin@eventgo.vn'), 'Should display target email');
  assert.ok(
    html.includes('https://proof.eventgo.vn/auth/invite?email=admin%40eventgo.vn&type=admin'),
    'Should contain invite link'
  );

  // Contains bilingual button
  assert.ok(
    html.includes('Accept Invitation &amp; Activate / Chấp Nhận Lời Mời') ||
    html.includes('Accept Invitation & Activate / Chấp Nhận Lời Mời'),
    'Should have bilingual CTA button'
  );
});

test('renderCampaignInviteEmailHtml renders a stacked bilingual layout for each role', () => {
  const roles = [CampaignRole.SUPERVISOR, CampaignRole.APPROVER, CampaignRole.MANAGER];

  for (const role of roles) {
    const html = renderCampaignInviteEmailHtml({
      to: 'member@eventgo.vn',
      inviterName: 'Lead Alex',
      campaignTitle: 'Summer FMCG Activation 2026',
      brandName: 'Brand X',
      role,
      inviteLink: 'https://proof.eventgo.vn/auth/invite?email=member%40eventgo.vn&campaignId=c1',
    });

    // Check titles
    assert.ok(html.includes('Campaign Collaboration Invitation'), 'Should have EN header');
    assert.ok(html.includes('Lời mời tham gia chiến dịch'), 'Should have VI header');
    assert.ok(html.includes('Summer FMCG Activation 2026'), 'Should have campaign title');
    assert.ok(html.includes('Brand X'), 'Should have brand name');

    // Role specific tests
    if (role === CampaignRole.SUPERVISOR) {
      assert.ok(html.includes('Site Supervisor'), 'Should include EN role title for supervisor');
      assert.ok(html.includes('Giám Sát Hiện Trường'), 'Should include VI role title for supervisor');
    } else if (role === CampaignRole.APPROVER) {
      assert.ok(html.includes('Evidence Approver'), 'Should include EN role title for approver');
      assert.ok(html.includes('Người Kiểm Duyệt Nghiệm Thu'), 'Should include VI role title for approver');
    } else if (role === CampaignRole.MANAGER) {
      assert.ok(html.includes('Campaign Manager'), 'Should include EN role title for manager');
      assert.ok(html.includes('Quản Lý Chiến Dịch'), 'Should include VI role title for manager');
    }

    // Bilingual CTA button
    assert.ok(
      html.includes('Accept Invitation &amp; Join / Chấp Nhận Lời Mời') ||
      html.includes('Accept Invitation & Join / Chấp Nhận Lời Mời'),
      'Should have bilingual CTA button'
    );
  }
});
