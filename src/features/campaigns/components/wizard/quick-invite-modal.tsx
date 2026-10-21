'use client';

import React, { useState } from 'react';
import { CampaignRole } from '@/domain/enums';
import { inviteMemberDirectAction } from '../../actions/member-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  X,
  UserPlus,
  Mail,
  CheckCircle2,
  Copy,
  AlertTriangle,
  Send,
  Sparkles,
} from 'lucide-react';

interface QuickInviteModalProps {
  campaignId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string, role: CampaignRole) => void;
  defaultRole?: CampaignRole;
}

export function QuickInviteModal({
  campaignId,
  isOpen,
  onClose,
  onSuccess,
  defaultRole = CampaignRole.SUPERVISOR,
}: QuickInviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CampaignRole>(defaultRole);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    message: string;
    inviteLink?: string;
    emailSent?: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuccessInfo(null);

    const res = await inviteMemberDirectAction({
      campaignId,
      email: email.trim().toLowerCase(),
      role,
    });

    setIsLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccessInfo({
        message: res.success || 'Đã thêm thành viên.',
        inviteLink: res.inviteLink,
        emailSent: res.emailSent,
      });
      onSuccess(email.trim().toLowerCase(), role);
    }
  };

  const handleCopyLink = () => {
    if (successInfo?.inviteLink) {
      navigator.clipboard.writeText(successInfo.inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResetAndClose = () => {
    setEmail('');
    setError(null);
    setSuccessInfo(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Mời nhân sự mới</h3>
              <p className="text-xs text-slate-500">Thêm nhân sự để phân công phụ trách gian hàng</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {successInfo ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-800 space-y-1">
                  <p className="font-semibold text-emerald-900">{successInfo.message}</p>
                  {successInfo.emailSent ? (
                    <p>Hệ thống đã gửi email mời tới <strong>{email}</strong> kèm hướng dẫn tham gia.</p>
                  ) : (
                    <p className="text-amber-700">
                      Chưa gửi được email tự động. Bạn có thể sao chép liên kết bên dưới để gửi trực tiếp qua Zalo/Telegram.
                    </p>
                  )}
                </div>
              </div>

              {successInfo.inviteLink && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Liên kết mời trực tiếp (Dự phòng)
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={successInfo.inviteLink}
                      className="text-xs bg-slate-50 font-mono text-slate-600 select-all"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCopyLink}
                      className="shrink-0 gap-1.5 text-xs bg-slate-800 hover:bg-slate-900 text-white"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copied ? 'Đã chép' : 'Sao chép'}
                    </Button>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEmail('');
                    setSuccessInfo(null);
                  }}
                  className="text-xs"
                >
                  Mời thêm người khác
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleResetAndClose}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  Hoàn tất & Tiếp tục phân công
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Email Google / Gmail *</span>
                  <span className="text-[10px] text-slate-400">Đăng nhập bằng tài khoản này</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    required
                    placeholder="nguyenvana@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-xs h-9 border-slate-200 focus-visible:ring-blue-600"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Vai trò phân công trong chiến dịch *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole(CampaignRole.SUPERVISOR)}
                    className={`flex flex-col text-left p-3 rounded-xl border text-xs transition-all ${
                      role === CampaignRole.SUPERVISOR
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20 text-slate-900 font-semibold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="text-blue-600 font-bold">Giám sát viên (Supervisor)</span>
                    <span className="text-[10px] text-slate-500 mt-1 font-normal leading-tight">
                      Chụp ảnh & nộp bằng chứng nghiệm thu tại Booth
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole(CampaignRole.APPROVER)}
                    className={`flex flex-col text-left p-3 rounded-xl border text-xs transition-all ${
                      role === CampaignRole.APPROVER
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20 text-slate-900 font-semibold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="text-indigo-600 font-bold">Người phê duyệt (Approver)</span>
                    <span className="text-[10px] text-slate-500 mt-1 font-normal leading-tight">
                      Duyệt đạt hoặc yêu cầu chụp lại bằng chứng
                    </span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-[11px] text-slate-500 flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Sau khi gửi, nhân sự sẽ nhận email kèm liên kết tham gia. Họ sẽ xuất hiện ngay trong danh sách để bạn gán vào Booth.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetAndClose}
                  className="text-xs"
                  disabled={isLoading}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoading || !email.trim()}
                  className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
                >
                  {isLoading ? (
                    'Đang gửi...'
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Gửi lời mời & Thêm vào danh sách
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
