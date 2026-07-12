import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS } from '../../constants';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LogOut, User as UserIcon, Settings, ShieldAlert, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProfileMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="w-9 h-9 rounded-full bg-indigo-500/10 text-primary border border-primary/20 hover:border-primary/50 transition-all flex items-center justify-center font-display font-bold text-sm uppercase cursor-pointer select-none focus:outline-none"
          aria-label="User profile menu"
        >
          {user.full_name[0]}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[240px] bg-card rounded-2xl border border-border p-2 shadow-2xl z-40 select-none animate-slide-in glass-panel focus:outline-none"
          align="end"
          sideOffset={8}
        >
          {/* User Profile Summary */}
          <div className="px-3 py-3 border-b border-border mb-1.5">
            <h3 className="text-xs font-semibold text-foreground truncate">{user.full_name}</h3>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{user.email}</p>
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wide font-display">
                {ROLE_LABELS[user.role]}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <DropdownMenu.Item
            onClick={() => navigate('/settings/profile')}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/60 cursor-pointer focus:outline-none"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>My Profile</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/60 cursor-pointer focus:outline-none"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Preferences</span>
          </DropdownMenu.Item>

          {/* Section Divider */}
          <DropdownMenu.Separator className="h-px bg-border my-1.5" />

          {/* Logout Action */}
          <DropdownMenu.Item
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer focus:outline-none"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
