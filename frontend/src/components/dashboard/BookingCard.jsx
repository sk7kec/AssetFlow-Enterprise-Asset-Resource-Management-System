function BookingCard({ bookings }) {
  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <article key={booking.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{booking.resource}</p>
              <p className="text-xs text-slate-500">Booked by {booking.bookedBy}</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {booking.status}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>{booking.slot}</span>
            <span>{booking.department}</span>
          </div>
        </article>
      ))}
    </div>
  )
}

export default BookingCard
