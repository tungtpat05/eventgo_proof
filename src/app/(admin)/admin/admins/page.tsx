'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  getAdminsAction,
  inviteAdminAction,
  revokeAdminAction,
  revokeInviteAction,
  resendAdminInviteEmailAction,
} from '@/features/admin/actions/admin-actions';
import { UserProfile, SystemAdminInvite } from '@/domain/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatDateTime } from '@/lib/utils';
import {
  UserPlus,
  Mail,
  ShieldCheck,
  Trash2,
  Clock,
  Loader2,
  CheckCircle2,
  Send,
  Copy,
  Check,
} from 'lucide-react';

function AdminAvatar({ fullName, avatarUrl }: { fullName: string; avatarUrl?: string | null }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  return (
    <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 shadow-xs">
      {avatarUrl && !imgError ? (
        <img
          src={avatarUrl}
          alt={fullName || 'Admin avatar'}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{fullName ? fullName.charAt(0).toUpperCase() : 'A'}</span>
      )}
    </div>
  );
}

export default function AdminMembersPage() {
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [invites, setInvites] = useState<SystemAdminInvite[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const data = await getAdminsAction();
      setAdmins(data.admins);
      setInvites(data.invites);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyInviteLink = (email: string) => {
    const link = `${window.location.origin}/auth/invite?email=${encodeURIComponent(email)}&type=admin`;
    navigator.clipboard.writeText(link);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  const handleResendEmail = (inviteId: string) => {
    startTransition(async () => {
      try {
        await resendAdminInviteEmailAction(inviteId);
        alert('Đã gửi lại email lời mời thành công!');
      } catch (err: any) {
        alert(err.message || 'Lỗi gửi lại email');
      }
    });
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    startTransition(async () => {
      try {
        const res = await inviteAdminAction(emailInput.trim());
        setEmailInput('');
        await loadData();
        if (res.emailSent) {
          alert(`Đã gửi email mời Quản trị viên thành công đến ${res.email}!`);
        } else {
          alert(
            `Đã tạo lời mời cho ${res.email} thành công!\n\n⚠️ Lưu ý: ${res.emailError || 'Chưa gửi được email do thiếu cấu hình SMTP'}.\nBạn có thể nhấn nút "Chép link" để gửi trực tiếp cho người nhận.`
          );
        }
      } catch (err: any) {
        alert(err.message || 'Lỗi gửi lời mời');
      }
    });
  };

  const handleRevokeAdmin = (userId: string) => {
    if (!confirm('Bạn có chắc muốn thu hồi quyền Quản trị viên của tài khoản này?')) return;
    startTransition(async () => {
      try {
        await revokeAdminAction(userId);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Lỗi thu hồi quyền');
      }
    });
  };

  const handleRevokeInvite = (inviteId: string) => {
    startTransition(async () => {
      try {
        await revokeInviteAction(inviteId);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Lỗi hủy lời mời');
      }
    });
  };

  return (
    <div className="space-y-8 max-w-5xl">

      {/* Invite Box */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
          <UserPlus className="h-5 w-5 text-blue-600" />
          <span>Mời Quản Trị Viên Mới Qua Email</span>
        </div>
        <p className="text-xs text-slate-500">
          Người được mời chỉ cần đăng nhập vào hệ thống bằng tài khoản Google có email tương ứng để tự động kích hoạt quyền Admin.
        </p>

        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="email"
              required
              placeholder="Nhập email Google (e.g. partner@gmail.com)..."
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <Button
            type="submit"
            disabled={isPending || !emailInput}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shrink-0"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
            Gửi Lời Mời Admin
          </Button>
        </form>
      </div>

      {/* Active Admins List */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          Quản Trị Viên Đang Hoạt Động ({admins.length})
        </h2>

        {isLoading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100 overflow-hidden">
            {admins.map((admin) => (
              <div key={admin.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <AdminAvatar fullName={admin.fullName} avatarUrl={admin.avatarUrl} />
                  <div>
                    <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      {admin.fullName}
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                        System Admin
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">{admin.email}</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRevokeAdmin(admin.id)}
                  disabled={isPending || admins.length <= 1}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1"
                  title={admins.length <= 1 ? 'Không thể xóa Admin duy nhất' : 'Thu hồi quyền'}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Thu hồi
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invites List */}
      {invites.length > 0 && (
        <div className="space-y-3 pt-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Lời Mời Đang Chờ Kích Hoạt ({invites.filter((i) => i.status === 'PENDING').length})
          </h2>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100 overflow-hidden">
            {invites.map((invite) => (
              <div key={invite.id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-800">{invite.email}</p>
                  <div className="text-slate-400 text-[11px] mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                    <span>Gửi lúc {formatDateTime(invite.createdAt)}</span>
                    {invite.status === 'ACCEPTED' && invite.acceptedAt && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-emerald-600 font-medium">
                          Kích hoạt lúc {formatDateTime(invite.acceptedAt)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {invite.status === 'PENDING' ? (
                    <>
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs gap-1 mr-1">
                        <Clock className="h-3 w-3" />
                        Chờ kích hoạt
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyInviteLink(invite.email)}
                        className="text-xs h-7 px-2 gap-1 border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200 cursor-pointer"
                        title="Sao chép link kích hoạt"
                      >
                        {copiedEmail === invite.email ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-emerald-600 font-medium">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-slate-500" />
                            <span>Chép link</span>
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResendEmail(invite.id)}
                        disabled={isPending}
                        className="text-xs h-7 px-2 gap-1 border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200 cursor-pointer"
                        title="Gửi lại email lời mời"
                      >
                        <Send className="h-3 w-3 text-slate-500" />
                        <span>Gửi lại mail</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRevokeInvite(invite.id)}
                        disabled={isPending}
                        className="text-xs h-7 px-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Thu hồi lời mời này"
                      >
                        <Trash2 className="h-3 w-3 mr-0.5" />
                        Hủy
                      </Button>
                    </>
                  ) : (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Đã kích hoạt
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
