function QuickActionCard({ icon: Icon, title, description, buttonText }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="mb-4 inline-flex rounded-xl bg-blue-50 p-3 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>

      <button className="mt-4 inline-flex rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
        {buttonText}
      </button>
    </article>
  )
}

export default QuickActionCard
