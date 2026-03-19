import Icon from '../../atoms/Icon';
import Button from '../../atoms/Button';
import PageHeader from '../../molecules/PageHeader';
import { useToast } from '../../../context/ToastContext';

const monthlyData = [
  { month: 'Oct', value: 18 },
  { month: 'Nov', value: 24 },
  { month: 'Dec', value: 15 },
  { month: 'Jan', value: 31 },
  { month: 'Feb', value: 27 },
  { month: 'Mar', value: 22 },
];

const topTitles = [
  { title: 'Cross on Evidence', loans: 12 },
  { title: 'Heydon on Contract', loans: 9 },
  { title: 'Fleming\'s Torts', loans: 7 },
  { title: 'Jacobs\' Trusts', loans: 6 },
  { title: 'Dal Pont on Lawyers', loans: 5 },
];

const memberActivity = [
  { name: 'Sarah Chen', role: 'Barrister', loans: 8, lastActive: '2 hours ago' },
  { name: 'Marcus Webb', role: 'Barrister', loans: 6, lastActive: '1 day ago' },
  { name: 'Alistair Keane', role: 'Barrister', loans: 5, lastActive: '3 hours ago' },
  { name: 'Nina Patel', role: 'Barrister', loans: 4, lastActive: '5 hours ago' },
  { name: 'David Liu', role: 'Barrister', loans: 3, lastActive: '2 days ago' },
];

const maxMonthly = Math.max(...monthlyData.map((d) => d.value));
const maxTitle = Math.max(...topTitles.map((d) => d.loans));

export default function ClerkReportsPage() {
  const { addToast } = useToast();

  return (
    <div className="animate-fade-in">
      <PageHeader title="Insights" subtitle="Library intelligence, usage trends, and coverage metrics.">
        <Button size="sm" variant="secondary" onClick={() => addToast({ message: 'Detailed analytics export is mocked in this prototype', type: 'info' })}>
          <Icon name="solar:upload-linear" size={14} />
          Export CSV
        </Button>
        <Button size="sm" variant="secondary" onClick={() => addToast({ message: 'Print layout is mocked in this prototype', type: 'info' })}>
          <Icon name="solar:printer-linear" size={14} />
          Print Report
        </Button>
      </PageHeader>

      {/* Summary cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Most Borrowed', 'Cross on Evidence', '12 loans', 'solar:trophy-linear', 'bg-amber-50', 'text-amber-500'],
          ['Avg. Duration', '9 days', 'per loan', 'solar:calendar-linear', 'bg-blue-50', 'text-blue-500'],
          ['Active Members', '85%', '7 of 8', 'solar:users-group-rounded-linear', 'bg-emerald-50', 'text-emerald-500'],
          ['Overdue Rate', '12%', '1 item', 'solar:graph-down-linear', 'bg-red-50', 'text-red-500'],
        ].map(([label, value, sub, icon, bg, color]) => (
          <article key={label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
              <Icon name={icon} size={20} className={color} />
            </span>
            <p className="mt-3 text-lg font-bold text-text">{value}</p>
            <p className="text-xs text-text-muted">{sub}</p>
            <p className="mt-1 text-sm text-text-secondary">{label}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Monthly Borrowing Trend */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="text-sm font-semibold text-text">Monthly Borrowing Trend</h2>
          <div className="mt-4 flex items-end gap-3" style={{ height: 160 }}>
            {monthlyData.map((d) => (
              <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-medium text-text-muted">{d.value}</span>
                <div
                  className="w-full rounded-t-lg bg-brand/80 transition-all duration-500"
                  style={{ height: `${(d.value / maxMonthly) * 120}px` }}
                />
                <span className="text-[10px] text-text-muted">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Titles */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="text-sm font-semibold text-text">Popular Titles</h2>
          <div className="mt-4 space-y-3">
            {topTitles.map((d) => (
              <div key={d.title}>
                <div className="flex items-center justify-between">
                  <span className="truncate text-xs text-text-secondary">{d.title}</span>
                  <span className="shrink-0 text-xs font-medium text-text">{d.loans}</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(d.loans / maxTitle) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Member Activity */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-text">Member Activity</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 text-xs text-text-secondary">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Role</th>
                  <th className="pb-2 pr-4 font-medium">Loans</th>
                  <th className="pb-2 font-medium">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {memberActivity.map((m) => (
                  <tr key={m.name} className="border-b border-border/30">
                    <td className="py-2.5 pr-4 font-medium text-text">{m.name}</td>
                    <td className="py-2.5 pr-4 text-text-secondary">{m.role}</td>
                    <td className="py-2.5 pr-4 text-text">{m.loans}</td>
                    <td className="py-2.5 text-text-muted">{m.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Catalogue Health */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-text">Catalogue Health</h2>
          <div className="mt-4 flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16">
                <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#10b981" strokeWidth="6"
                    strokeDasharray={`${(2 / 13) * 175.9} 175.9`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-text">15%</span>
              </div>
              <div>
                <p className="text-sm font-medium text-text">Enrichment Progress</p>
                <p className="text-xs text-text-muted">2 of 13 books enriched</p>
              </div>
            </div>
            <div className="flex-1">
              <div className="h-3 w-full rounded-full bg-slate-100">
                <div className="h-3 rounded-full bg-emerald-500 transition-all duration-500" style={{ width: '15%' }} />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-text-muted">
                <span>ISBN Only: 11</span>
                <span>Enriched: 2</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
