function NotificationPanel({ notifications }) {
  return (
    <div className="space-y-3">
      {notifications.map((item) => (
        <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="mt-1 text-sm text-slate-500">{item.message}</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">{item.time}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default NotificationPanel
