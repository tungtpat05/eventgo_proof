import { UserProfile } from '@/domain/entities';
import { signOutAction } from '@/features/auth/actions/auth-actions';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  user: UserProfile;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div>
        <p className="text-sm font-semibold text-slate-900">{user.fullName}</p>
        <p className="text-xs text-slate-500">{user.email}</p>
      </div>
      <form action={signOutAction}>
        <Button type="submit" variant="ghost" size="sm" className="gap-2 text-slate-600">
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </Button>
      </form>
    </header>
  );
}
