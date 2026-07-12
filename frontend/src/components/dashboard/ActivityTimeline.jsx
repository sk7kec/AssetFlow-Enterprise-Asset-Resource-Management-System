import { Activity, ArrowUpCircle, CheckCircle2, CircleAlert } from 'lucide-react'

const iconMap = {
  approved: CheckCircle2,
  booked: ArrowUpCircle,
  audit: Activity,
  alert: CircleAlert,
}

function ActivityTimeline({ activities }) {
  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = iconMap[activity.type] || Activity
        const statusClasses = {
          success: 'bg-emerald-50 text-emerald-700',
          info: 'bg-blue-50 text-blue-700',
          warning: 'bg-amber-50 text-amber-700',
        }

        return (
          <div key={activity.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
            <div className={`rounded-full p-2 ${statusClasses[activity.status]}`}>
              <Icon className="h-4 w-4" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-800">{activity.title}</p>
                <span className="text-xs font-semibold text-slate-400">{activity.time}</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{activity.detail}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ActivityTimeline
