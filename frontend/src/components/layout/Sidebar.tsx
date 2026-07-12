import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../constants';
import { motion } from 'framer-motion';
import {
  Box,
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  FolderTree,
  QrCode,
  FileSpreadsheet,
  CalendarDays,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Settings,
  Menu,
  ChevronLeft,
  Activity,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();
  const role = user?.role || UserRole.EMPLOYEE;

  // Navigation schema with role restrictions
  const navigation = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD, UserRole.EMPLOYEE] },
    {
      name: 'Organization',
      category: true,
      roles: [UserRole.ADMIN, UserRole.DEPARTMENT_HEAD],
      children: [
        { name: 'Departments', to: '/departments', icon: Building2, roles: [UserRole.ADMIN] },
        { name: 'Employees', to: '/employees', icon: Users, roles: [UserRole.ADMIN, UserRole.DEPARTMENT_HEAD] },
        { name: 'User Roles', to: '/roles', icon: ShieldCheck, roles: [UserRole.ADMIN] },
      ],
    },
    {
      name: 'Assets',
      category: true,
      roles: [UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD, UserRole.EMPLOYEE],
      children: [
        { name: 'Categories', to: '/asset-categories', icon: FolderTree, roles: [UserRole.ADMIN, UserRole.ASSET_MANAGER] },
        { name: 'Asset Catalog', to: '/assets', icon: QrCode, roles: [UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD, UserRole.EMPLOYEE] },
      ],
    },
    {
      name: 'Operations',
      category: true,
      roles: [UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD, UserRole.EMPLOYEE],
      children: [
        { name: 'Allocations', to: '/allocations', icon: FileSpreadsheet, roles: [UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD] },
        { name: 'Bookings', to: '/bookings', icon: CalendarDays, roles: [UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD, UserRole.EMPLOYEE] },
        { name: 'Maintenance', to: '/maintenance', icon: Wrench, roles: [UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD, UserRole.EMPLOYEE] },
        { name: 'Audit Cycles', to: '/audits', icon: ClipboardCheck, roles: [UserRole.ADMIN, UserRole.ASSET_MANAGER] },
      ],
    },
    {
      name: 'Insights',
      category: true,
      roles: [UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD],
      children: [
        { name: 'Reports', to: '/reports', icon: BarChart3, roles: [UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD] },
        { name: 'Activity Logs', to: '/activity-logs', icon: Activity, roles: [UserRole.ADMIN] },
      ],
    },
    { name: 'Settings', to: '/settings', icon: Settings, roles: [UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD, UserRole.EMPLOYEE] },
  ];

  return (
    <motion.div
      animate={{ width: isOpen ? '260px' : '72px' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="hidden md:flex flex-col h-screen sticky top-0 bg-card border-r border-border overflow-hidden select-none shrink-0"
    >
      {/* Sidebar Header Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-500 shadow-md shadow-indigo-500/20 shrink-0">
            <Box className="w-4 h-4 text-white" />
          </div>
          {isOpen && (
            <span className="font-display font-bold text-lg bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent truncate">
              AssetFlow
            </span>
          )}
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Sidebar Menu Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {navigation.map((item, idx) => {
          // Verify role permissions
          if (!item.roles.includes(role)) return null;

          if (item.category) {
            return (
              <div key={idx} className="space-y-1">
                {isOpen && (
                  <h3 className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {item.name}
                  </h3>
                )}
                {item.children?.map((child, cIdx) => {
                  if (!child.roles.includes(role)) return null;
                  const Icon = child.icon;

                  return (
                    <NavLink
                      key={cIdx}
                      to={child.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                          isActive
                            ? 'bg-primary text-white shadow-md shadow-indigo-500/10'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                        }`
                      }
                    >
                      <Icon className="w-4 h-5 shrink-0" />
                      {isOpen && <span className="truncate">{child.name}</span>}
                    </NavLink>
                  );
                })}
              </div>
            );
          }

          const Icon = item.icon!;
          return (
            <NavLink
              key={idx}
              to={item.to!}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-indigo-500/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                }`
              }
            >
              <Icon className="w-4 h-5 shrink-0" />
              {isOpen && <span className="truncate">{item.name}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* Sidebar Footer Account Badge */}
      {isOpen && user && (
        <div className="p-4 border-t border-border flex items-center gap-3 bg-accent/25 m-3 rounded-2xl">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-display font-bold text-xs uppercase">
            {user.full_name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate text-foreground">{user.full_name}</p>
            <p className="text-[10px] text-muted-foreground truncate uppercase font-display font-medium tracking-wide">
              {role.replace('_', ' ')}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};
