import { LayoutDashboard, Building2, Package, ArrowRightLeft, CalendarDays, Wrench, ShieldCheck, BarChart3, Bell, Settings, UserRound, Box } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Organization Setup', icon: Building2 },
  { label: 'Assets', icon: Package },
  { label: 'Asset Allocation', icon: Box },
  { label: 'Resource Booking', icon: CalendarDays },
  { label: 'Maintenance', icon: Wrench },
  { label: 'Asset Audit', icon: ShieldCheck },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Notifications', icon: Bell },
  { label: 'Settings', icon: Settings },
]

function Sidebar() {
  return (
    <aside className="flex h-screen w-full flex-col border-r border-slate-200 bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-2.5 text-white">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-300">AssetFlow</p>
            <h2 className="text-lg font-semibold text-white">ERP</h2>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon

          return (
            <a
              key={item.label}
              href="#"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </a>
          )
        })}
      </nav>

      <div className="border-t border-slate-800 px-3 py-4">
        <div className="flex items-center gap-3 rounded-xl bg-slate-900 px-3 py-3">
          <div className="rounded-full bg-blue-600 p-2 text-white">
            <UserRound className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Asset Manager</p>
            <p className="text-xs text-slate-400">Operations</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
