import { Bell, Moon, Search, Sun, UserCircle2 } from 'lucide-react'

function Navbar() {
  return (
    <header className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-1 items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500">
          <Search className="h-4 w-4" />
          <input
            type="search"
            placeholder="Search assets, bookings, reports..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50">
          <Bell className="h-4 w-4" />
        </button>

        <button className="rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50">
          <Moon className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
          <UserCircle2 className="h-8 w-8 text-blue-600" />
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-slate-900">Ava Thompson</p>
            <p className="text-xs text-slate-500">Asset Manager</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
