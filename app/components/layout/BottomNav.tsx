import {
	BarChart2,
	Building2,
	FileText,
	LayoutDashboard,
	Users,
} from 'lucide-react';
import { NavLink } from 'react-router';
import { cn } from '~/lib/utils';

const navItems = [
	{ to: '/', label: 'Tổng quan', icon: LayoutDashboard, end: true },
	{ to: '/work-logs', label: 'Bảng công', icon: FileText },
	{ to: '/reports/attendance', label: 'Báo cáo', icon: BarChart2 },
	{ to: '/employees', label: 'Nhân viên', icon: Users },
	{ to: '/organizations', label: 'Cơ quan', icon: Building2 },
];

export default function BottomNav() {
	return (
		<nav className="bottom-nav md:hidden fixed bottom-0 inset-x-0 z-50 flex items-stretch border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			{navItems.map(({ to, label, icon: Icon, end }) => (
				<NavLink
					key={to}
					to={to}
					end={end}
					className={({ isActive }) =>
						cn(
							'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 px-0.5 transition-colors',
							isActive
								? 'text-primary'
								: 'text-muted-foreground hover:text-foreground',
						)
					}>
					{({ isActive }) => (
						<>
							<span
								className={cn(
									'flex h-6 w-6 items-center justify-center rounded-md transition-colors',
									isActive && 'bg-primary/10',
								)}>
								<Icon className="h-[18px] w-[18px]" />
							</span>
							<span className="text-[10px] font-medium leading-none">
								{label}
							</span>
						</>
					)}
				</NavLink>
			))}
		</nav>
	);
}
