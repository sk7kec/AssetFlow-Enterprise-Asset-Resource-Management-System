import { ArrowUpRight } from 'lucide-react'

function KPICard({ icon: Icon, title, value, trend, accentColor = 'blue' }) {
  const accentMap = {
    blue: 'border-blue-500 bg-blue-50 text-blue-600',
    emerald: 'border-emerald-500 bg-emerald-50 text-emerald-600',
    amber: 'border-amber-500 bg-amber-50 text-amber-600',
    violet: 'border-violet-500 bg-violet-50 text-violet-600',
    rose: 'border-rose-500 bg-rose-50 text-rose-600',
    slate: 'border-slate-500 bg-slate-50 text-slate-600',
  }

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className={`rounded-xl border-l-4 ${accentMap[accentColor]} p-3`}>
          <Icon className="h-5 w-5" />
        </div>

        {trend && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
            <ArrowUpRight className="h-3.5 w-3.5" />
            {trend}
          </span>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </article>
  )
}

export default KPICard
