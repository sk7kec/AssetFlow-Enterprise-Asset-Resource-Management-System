import {
  ArrowRightLeft,
  CalendarDays,
  Clock3,
  Laptop,
  Package,
  Wrench,
} from 'lucide-react'

export const kpiData = [
  {
    title: 'Assets Available',
    value: '320',
    trend: '+12%',
    icon: Package,
    accentColor: 'blue',
  },
  {
    title: 'Assets Allocated',
    value: '198',
    trend: '+6%',
    icon: Laptop,
    accentColor: 'emerald',
  },
  {
    title: 'Maintenance Today',
    value: '14',
    trend: null,
    icon: Wrench,
    accentColor: 'amber',
  },
  {
    title: 'Active Bookings',
    value: '29',
    trend: '+8%',
    icon: CalendarDays,
    accentColor: 'violet',
  },
  {
    title: 'Pending Transfers',
    value: '07',
    trend: '+3%',
    icon: ArrowRightLeft,
    accentColor: 'rose',
  },
  {
    title: 'Upcoming Returns',
    value: '11',
    trend: '+4%',
    icon: Clock3,
    accentColor: 'slate',
  },
]

export const quickActions = [
  {
    title: 'Register Asset',
    description: 'Create and tag new enterprise assets for immediate tracking.',
    buttonText: 'Open Form',
    icon: Package,
  },
  {
    title: 'Book Shared Resource',
    description: 'Schedule meeting rooms, laptops, and strategic tools quickly.',
    buttonText: 'Reserve Now',
    icon: CalendarDays,
  },
  {
    title: 'Raise Maintenance Request',
    description: 'Log service requests before equipment downtime can escalate.',
    buttonText: 'Create Ticket',
    icon: Wrench,
  },
]

export const pieChartData = [
  { name: 'Available', value: 38, color: '#2563eb' },
  { name: 'Allocated', value: 24, color: '#10b981' },
  { name: 'Reserved', value: 17, color: '#8b5cf6' },
  { name: 'Maintenance', value: 12, color: '#f59e0b' },
  { name: 'Lost', value: 6, color: '#ef4444' },
  { name: 'Disposed', value: 3, color: '#64748b' },
]

export const lineChartData = [
  { month: 'Jan', allocated: 28 },
  { month: 'Feb', allocated: 31 },
  { month: 'Mar', allocated: 34 },
  { month: 'Apr', allocated: 40 },
  { month: 'May', allocated: 36 },
  { month: 'Jun', allocated: 44 },
  { month: 'Jul', allocated: 49 },
  { month: 'Aug', allocated: 46 },
  { month: 'Sep', allocated: 51 },
  { month: 'Oct', allocated: 57 },
  { month: 'Nov', allocated: 61 },
  { month: 'Dec', allocated: 67 },
]

export const activityData = [
  {
    id: 1,
    title: 'Asset AF-0008 allocated',
    detail: 'Assigned to Finance Department for the current quarter.',
    time: '09:15 AM',
    status: 'success',
    type: 'approved',
  },
  {
    id: 2,
    title: 'Maintenance Approved',
    detail: 'Preventive service request approved for warehouse equipment.',
    time: '10:40 AM',
    status: 'info',
    type: 'approved',
  },
  {
    id: 3,
    title: 'Booking Confirmed',
    detail: 'Conference room ALPHA is reserved for the operations review.',
    time: '11:20 AM',
    status: 'info',
    type: 'booked',
  },
  {
    id: 4,
    title: 'Transfer Approved',
    detail: 'Transfer request for laptop inventory has been approved.',
    time: '01:10 PM',
    status: 'success',
    type: 'approved',
  },
  {
    id: 5,
    title: 'Audit Completed',
    detail: 'Quarterly audit review completed with no critical exceptions.',
    time: '03:05 PM',
    status: 'success',
    type: 'audit',
  },
]

export const overdueRows = [
  {
    id: 1,
    assetTag: 'AF-0008',
    employee: 'Hannah Chen',
    department: 'Finance',
    expectedReturn: '2026-07-01',
    daysOverdue: 11,
    status: 'Overdue',
  },
  {
    id: 2,
    assetTag: 'AF-0017',
    employee: 'Marcus Reed',
    department: 'Operations',
    expectedReturn: '2026-07-03',
    daysOverdue: 9,
    status: 'Overdue',
  },
  {
    id: 3,
    assetTag: 'AF-0032',
    employee: 'Nina Park',
    department: 'HR',
    expectedReturn: '2026-07-06',
    daysOverdue: 6,
    status: 'Overdue',
  },
]

export const upcomingBookings = [
  {
    id: 1,
    resource: 'Meeting Room Alpha',
    bookedBy: 'Operations Team',
    slot: '10:00 AM - 11:30 AM',
    status: 'Confirmed',
    department: 'Executive',
  },
  {
    id: 2,
    resource: 'Laptop Pool 04',
    bookedBy: 'Field Sales',
    slot: '01:00 PM - 04:00 PM',
    status: 'Pending',
    department: 'Sales',
  },
  {
    id: 3,
    resource: 'Workshop Bay 02',
    bookedBy: 'Maintenance Team',
    slot: '03:00 PM - 05:00 PM',
    status: 'Confirmed',
    department: 'Facilities',
  },
]

export const notificationData = [
  {
    id: 1,
    title: 'Booking Reminder',
    message: 'Warehouse room booking starts in 30 minutes.',
    time: '10 min ago',
  },
  {
    id: 2,
    title: 'Maintenance Approved',
    message: 'New maintenance ticket is approved for Asset AF-2056.',
    time: '22 min ago',
  },
  {
    id: 3,
    title: 'Transfer Approved',
    message: 'Transfer request for the mobile lab has been accepted.',
    time: '55 min ago',
  },
  {
    id: 4,
    title: 'Audit Discrepancy',
    message: 'One asset coding mismatch needs review in procurement.',
    time: '1 hr ago',
  },
  {
    id: 5,
    title: 'Overdue Return',
    message: 'Three return deadlines exceeded the approved window.',
    time: '2 hrs ago',
  },
]
