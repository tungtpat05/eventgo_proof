import nodemailer from 'nodemailer';
import { env } from '@/config/env';
import { CampaignRole } from '@/domain/enums';

interface SendAdminInviteParams {
  to: string;
  inviterName: string;
  inviteLink: string;
}

interface SendCampaignInviteParams {
  to: string;
  inviterName: string;
  campaignTitle: string;
  brandName?: string | null;
  role: CampaignRole;
  inviteLink: string;
  locale?: 'vi' | 'en';
}

export function isMailConfigured(): boolean {
  return Boolean(env.SMTP_USER && env.SMTP_PASSWORD);
}

function getMailTransporter() {
  if (!isMailConfigured()) {
    throw new Error(
      'Hệ thống chưa cấu hình SMTP_USER và SMTP_PASSWORD (Mật khẩu ứng dụng Google). Vui lòng thêm vào file .env.local'
    );
  }

  // Sanitize Google App Password: strip any spaces (e.g., 'xxxx xxxx xxxx xxxx' -> 'xxxxxxxxxxxxxxxx')
  const cleanPassword = env.SMTP_PASSWORD ? env.SMTP_PASSWORD.replace(/\s+/g, '') : '';

  return nodemailer.createTransport({
    host: env.SMTP_HOST || 'smtp.gmail.com',
    port: env.SMTP_PORT || 465,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: cleanPassword,
    },
    connectionTimeout: 10000, // 10s timeout chống nghẽn server
  });
}

/**
 * Render HTML song ngữ cho email mời Quản trị viên hệ thống (Admin Invite)
 */
export function renderAdminInviteEmailHtml({ to, inviterName, inviteLink }: SendAdminInviteParams): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>System Administrator Invitation / Lời mời Quản trị viên</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 36px 24px; text-align: center; color: white; }
          .logo { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
          .badge { display: inline-block; background: rgba(255, 255, 255, 0.2); padding: 4px 14px; border-radius: 9999px; font-size: 11px; margin-top: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
          .content { padding: 32px 28px; line-height: 1.6; }
          .title { font-size: 19px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
          .info-box { background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin: 18px 0; }
          .info-row { margin: 4px 0; font-size: 13.5px; color: #1e40af; }
          .btn-container { text-align: center; margin: 28px 0 20px 0; }
          .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 600; font-size: 15px; padding: 14px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
          .divider { border: 0; border-top: 1px dashed #cbd5e1; margin: 28px 0; }
          .link-alt { word-break: break-all; font-size: 12px; color: #64748b; margin-top: 24px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px dashed #cbd5e1; }
          .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">EventGo Proof</div>
            <div class="badge">System Administrator • Quản Trị Viên Hệ Thống</div>
          </div>
          <div class="content">
            <!-- English Section -->
            <h2 class="title">System Administrator Invitation</h2>
            <p>Hello,</p>
            <p><strong>${inviterName}</strong> has invited you to join the System Administrator team on <strong>EventGo Proof</strong>.</p>
            
            <div class="info-box">
              <div class="info-row"><strong>Authorized Email:</strong> ${to}</div>
              <div class="info-row"><strong>Assigned Role:</strong> System Administrator (Full access + PRO Plan)</div>
            </div>

            <p>Click the button below to accept and sign in with your authorized Google account to activate privileges:</p>

            <div class="btn-container">
              <a href="${inviteLink}" class="btn" target="_blank">Accept Invitation & Activate / Chấp Nhận Lời Mời</a>
            </div>

            <hr class="divider" />

            <!-- Vietnamese Section -->
            <h2 class="title">Lời mời tham gia Quản Trị Viên Hệ Thống</h2>
            <p>Xin chào,</p>
            <p><strong>${inviterName}</strong> vừa gửi lời mời bạn tham gia đội ngũ Quản trị viên hệ thống (System Admin) trên nền tảng <strong>EventGo Proof</strong>.</p>
            
            <div class="info-box">
              <div class="info-row"><strong>Email được cấp quyền:</strong> ${to}</div>
              <div class="info-row"><strong>Vai trò:</strong> System Administrator (Toàn quyền quản trị + Gói PRO)</div>
            </div>

            <p>Để hoàn tất kích hoạt quyền quản trị, bạn chỉ cần đăng nhập vào hệ thống bằng tài khoản Google (Gmail) tương ứng.</p>

            <div class="link-alt">
              <strong>Direct Link / Đường dẫn trực tiếp:</strong><br/>
              <a href="${inviteLink}" style="color: #2563eb; text-decoration: underline;">${inviteLink}</a>
            </div>
          </div>
          <div class="footer">
            <p style="margin: 0 0 6px 0;">This email was sent automatically from EventGo Proof. If you were not expecting this invitation, please ignore it.</p>
            <p style="margin: 0;">Email này được gửi tự động từ hệ thống EventGo Proof. Nếu bạn không mong đợi lời mời này, vui lòng bỏ qua.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Gửi email mời Quản trị viên hệ thống (System Admin)
 */
export async function sendAdminInviteEmail({ to, inviterName, inviteLink }: SendAdminInviteParams) {
  const transporter = getMailTransporter();
  const subject = `[EventGo Proof] System Admin Invitation / Lời mời Quản trị viên hệ thống từ ${inviterName}`;
  const html = renderAdminInviteEmailHtml({ to, inviterName, inviteLink });

  return await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text: `[EventGo Proof] ${inviterName} invited you to join System Administrator / mời bạn tham gia Quản trị viên hệ thống EventGo Proof. Link: ${inviteLink}`,
    html,
  });
}

const roleLabelsVi: Record<CampaignRole, { title: string; desc: string }> = {
  [CampaignRole.SUPERVISOR]: {
    title: 'Giám Sát Hiện Trường',
    desc: 'Chịu trách nhiệm chụp ảnh check-in, kiểm tra tiêu chí gian hàng và nộp bằng chứng nghiệm thu tại các Booth được phân công.',
  },
  [CampaignRole.APPROVER]: {
    title: 'Người Kiểm Duyệt Nghiệm Thu',
    desc: 'Chịu trách nhiệm kiểm tra, đối soát chất lượng hình ảnh và phê duyệt đạt chuẩn hoặc yêu cầu chỉnh sửa cho các gian hàng.',
  },
  [CampaignRole.MANAGER]: {
    title: 'Quản Lý Chiến Dịch',
    desc: 'Toàn quyền cấu hình địa điểm, phân công nhân sự và quản lý vòng đời chiến dịch.',
  },
};

const roleLabelsEn: Record<CampaignRole, { title: string; desc: string }> = {
  [CampaignRole.SUPERVISOR]: {
    title: 'Site Supervisor',
    desc: 'Responsible for check-in photos, verifying booth criteria, and submitting acceptance proof for assigned booths.',
  },
  [CampaignRole.APPROVER]: {
    title: 'Evidence Approver',
    desc: 'Responsible for inspecting on-site proof photos and approving compliance or requesting revisions.',
  },
  [CampaignRole.MANAGER]: {
    title: 'Campaign Manager',
    desc: 'Full authority to configure campaign hierarchy, team assignments, and manage lifecycle.',
  },
};

/**
 * Render HTML song ngữ cho email mời thành viên chiến dịch (Campaign Invite)
 */
export function renderCampaignInviteEmailHtml({
  to,
  inviterName,
  campaignTitle,
  brandName,
  role,
  inviteLink,
}: SendCampaignInviteParams): string {
  const roleEn = roleLabelsEn[role] || { title: role, desc: 'Campaign Team Member' };
  const roleVi = roleLabelsVi[role] || { title: role, desc: 'Thành viên phối hợp vận hành chiến dịch.' };

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Campaign Invitation / Lời mời tham gia chiến dịch</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 36px 24px; text-align: center; color: white; }
          .logo { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
          .badge { display: inline-block; background: rgba(255, 255, 255, 0.2); padding: 4px 14px; border-radius: 9999px; font-size: 11px; margin-top: 10px; font-weight: 600; letter-spacing: 0.3px; text-transform: uppercase; }
          .content { padding: 32px 28px; line-height: 1.6; }
          .title { font-size: 19px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
          .info-box { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 18px 0; }
          .info-row { margin: 5px 0; font-size: 13.5px; color: #166534; }
          .role-desc { font-size: 13px; color: #475569; background: #f8fafc; padding: 12px 14px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-top: 14px; }
          .btn-container { text-align: center; margin: 28px 0 20px 0; }
          .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 600; font-size: 15px; padding: 14px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); }
          .divider { border: 0; border-top: 1px dashed #cbd5e1; margin: 28px 0; }
          .link-alt { word-break: break-all; font-size: 12px; color: #64748b; margin-top: 24px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px dashed #cbd5e1; }
          .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">EventGo Proof</div>
            <div class="badge">Booth Evidence & Acceptance • Nghiệm Thu Gian Hàng</div>
          </div>
          <div class="content">
            <!-- English Section -->
            <h2 class="title">Campaign Collaboration Invitation</h2>
            <p>Hello,</p>
            <p><strong>${inviterName}</strong> has invited you to join campaign <strong>${campaignTitle}</strong>${brandName ? ` (Brand: <strong>${brandName}</strong>)` : ''}.</p>
            
            <div class="info-box">
              <div class="info-row"><strong>Invitee Email:</strong> ${to}</div>
              <div class="info-row"><strong>Campaign:</strong> ${campaignTitle}</div>
              <div class="info-row"><strong>Assigned Role:</strong> ${roleEn.title}</div>
            </div>

            <div class="role-desc">
              <strong>Role Responsibility:</strong> ${roleEn.desc}
            </div>

            <p style="margin-top: 18px;">Click below to accept and sign in with your Google account to get started:</p>

            <div class="btn-container">
              <a href="${inviteLink}" class="btn" target="_blank">Accept Invitation & Join / Chấp Nhận Lời Mời</a>
            </div>

            <hr class="divider" />

            <!-- Vietnamese Section -->
            <h2 class="title">Lời mời tham gia chiến dịch</h2>
            <p>Xin chào,</p>
            <p><strong>${inviterName}</strong> vừa mời bạn tham gia vận hành chiến dịch <strong>${campaignTitle}</strong>${brandName ? ` (Thương hiệu: <strong>${brandName}</strong>)` : ''}.</p>
            
            <div class="info-box">
              <div class="info-row"><strong>Email nhận lời mời:</strong> ${to}</div>
              <div class="info-row"><strong>Chiến dịch:</strong> ${campaignTitle}</div>
              <div class="info-row"><strong>Vai trò được chỉ định:</strong> ${roleVi.title}</div>
            </div>

            <div class="role-desc">
              <strong>Mô tả nhiệm vụ:</strong> ${roleVi.desc}
            </div>

            <p style="margin-top: 18px;">Để xác nhận tham gia và bắt đầu nhận phân công gian hàng, bạn chỉ cần đăng nhập bằng tài khoản Google (Gmail) tương ứng.</p>

            <div class="link-alt">
              <strong>Direct Link / Đường dẫn trực tiếp:</strong><br/>
              <a href="${inviteLink}" style="color: #2563eb; text-decoration: underline;">${inviteLink}</a>
            </div>
          </div>
          <div class="footer">
            <p style="margin: 0 0 6px 0;">This email was sent automatically from EventGo Proof. If you were not expecting this invitation, please ignore it.</p>
            <p style="margin: 0;">Email này được gửi tự động từ nền tảng EventGo Proof. Nếu bạn không tham gia chiến dịch này, vui lòng bỏ qua.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Gửi email mời Thành viên tham gia chiến dịch (Supervisor / Approver / Manager)
 */
export async function sendCampaignInviteEmail(params: SendCampaignInviteParams) {
  const transporter = getMailTransporter();
  const roleEn = roleLabelsEn[params.role] || { title: params.role };
  const roleVi = roleLabelsVi[params.role] || { title: params.role };

  const subject = `[EventGo Proof] Invitation / Lời mời: "${params.campaignTitle}" (${roleEn.title} / ${roleVi.title})`;
  const html = renderCampaignInviteEmailHtml(params);

  return await transporter.sendMail({
    from: env.SMTP_FROM,
    to: params.to,
    subject,
    text: `[EventGo Proof] ${params.inviterName} invited you to join campaign "${params.campaignTitle}" (${roleEn.title} / ${roleVi.title}). Link: ${params.inviteLink}`,
    html,
  });
}

