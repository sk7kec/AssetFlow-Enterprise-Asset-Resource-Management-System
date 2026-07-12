function OverdueReturnsTable({ rows }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3 font-semibold">Asset Tag</th>
            <th className="px-4 py-3 font-semibold">Employee</th>
            <th className="px-4 py-3 font-semibold">Department</th>
            <th className="px-4 py-3 font-semibold">Expected Return Date</th>
            <th className="px-4 py-3 font-semibold">Days Overdue</th>
            <th className="px-4 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={row.status === 'Overdue' ? 'bg-rose-50/60' : 'bg-white'}>
              <td className="px-4 py-3 font-medium text-slate-800">{row.assetTag}</td>
              <td className="px-4 py-3 text-slate-600">{row.employee}</td>
              <td className="px-4 py-3 text-slate-600">{row.department}</td>
              <td className="px-4 py-3 text-slate-600">{row.expectedReturn}</td>
              <td className="px-4 py-3 font-semibold text-rose-600">{row.daysOverdue}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default OverdueReturnsTable
