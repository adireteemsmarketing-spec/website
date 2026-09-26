import { PatronDashboardShell } from '@/components/patron-dashboard-shell'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <PatronDashboardShell>{children}</PatronDashboardShell>
}
