import { useEffect, useMemo, useState } from 'react'
import {
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import KPICard from '../components/dashboard/KPICard.jsx'
import QuickActionCard from '../components/dashboard/QuickActionCard.jsx'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import Navbar from '../components/dashboard/Navbar.jsx'
import ActivityTimeline from '../components/dashboard/ActivityTimeline.jsx'
import OverdueReturnsTable from '../components/dashboard/OverdueReturnsTable.jsx'
import BookingCard from '../components/dashboard/BookingCard.jsx'
import NotificationPanel from '../components/dashboard/NotificationPanel.jsx'
import PieChartCard from '../components/dashboard/PieChartCard.jsx'
import LineChartCard from '../components/dashboard/LineChartCard.jsx'
import {
  activityData,
  kpiData,
  lineChartData,
  notificationData,
  overdueRows,
  pieChartData,
  quickActions,
  upcomingBookings,
} from '../data/dashboardMockData.js'

function Dashboard() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 700)
    return () => window.clearTimeout(timer)
  }, [])

  const today = useMemo(() => new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }), [])

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[260px_minmax(0,1fr)]">
        <Sidebar />

        <div className="p-4 lg:p-6">
          <Navbar />

          <main className="mt-6 space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    Welcome back, Asset Manager 👋
                  </p>
                  <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    AssetFlow – Enterprise Asset &amp; Resource Management System
                  </h1>
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <span>{today}</span>
                    <ChevronRight className="h-4 w-4" />
                    <span>Home &gt; Dashboard</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-4 h-10 w-10 rounded-xl bg-slate-200" />
                      <div className="mb-3 h-4 w-24 rounded bg-slate-200" />
                      <div className="h-8 w-28 rounded bg-slate-200" />
                    </div>
                  ))
                : kpiData.map((item) => (
                    <KPICard
                      key={item.title}
                      icon={item.icon}
                      title={item.title}
                      value={item.value}
                      trend={item.trend}
                      accentColor={item.accentColor}
                    />
                  ))}
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              {quickActions.map((action) => (
                <QuickActionCard
                  key={action.title}
                  icon={action.icon}
                  title={action.title}
                  description={action.description}
                  buttonText={action.buttonText}
                />
              ))}
            </section>

            <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
              <PieChartCard data={pieChartData} />
              <LineChartCard data={lineChartData} />
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Recent Activities</h3>
                    <p className="text-sm text-slate-500">Latest operational updates</p>
                  </div>
                </div>
                <ActivityTimeline activities={activityData} />
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
                  <p className="text-sm text-slate-500">Latest alerts and reminders</p>
                </div>
                <NotificationPanel notifications={notificationData} />
              </article>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Overdue Returns</h3>
                  <p className="text-sm text-slate-500">Assets requiring immediate attention</p>
                </div>
                <OverdueReturnsTable rows={overdueRows} />
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Upcoming Bookings</h3>
                  <p className="text-sm text-slate-500">Scheduled resources for the day</p>
                </div>
                <BookingCard bookings={upcomingBookings} />
              </article>
            </section>

            <footer className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-500 shadow-sm">
              <span className="font-semibold text-slate-800">AssetFlow ERP</span>
              <span>Version 1.0</span>
            </footer>
          </main>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
