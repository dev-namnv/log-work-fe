import {
	BarChart2,
	Building2,
	ClipboardCheck,
	FileText,
	LayoutDashboard,
	LogIn,
	LogOut,
	Users,
} from 'lucide-react';
import { Link, NavLink } from 'react-router';
import { useAuth } from '~/contexts/auth-context';
import { useLogoutMutation } from '~/hooks/use-auth-mutations';
import { cn } from '~/lib/utils';

const navItems = [
	{ to: '/', label: 'Tổng quan', icon: LayoutDashboard, end: true },
	{ to: '/check-in', label: 'Chấm công', icon: ClipboardCheck },
	{ to: '/work-logs', label: 'Bảng công', icon: FileText },
	{ to: '/reports/attendance', label: 'Báo cáo', icon: BarChart2 },
	{ to: '/employees', label: 'Nhân viên', icon: Users },
	{ to: '/organizations', label: 'Cơ quan', icon: Building2 },
];

export default function Header() {
	const { user, loading } = useAuth();

	const userInitials = user
		? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
		: '';

	const { mutate: logout } = useLogoutMutation();

	function handleLogout() {
		logout();
	}

	return (
		<header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="mx-auto flex h-14 max-w-screen-xl items-center gap-4 px-4 sm:px-6">
				{/* Logo */}
				<NavLink to="/" className="flex items-center gap-2 shrink-0">
					<div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
						<ClipboardCheck className="h-4 w-4 text-primary-foreground" />
					</div>
					<span className="font-semibold text-sm hidden sm:block">
						Log Work
					</span>
				</NavLink>

				{/* Desktop Nav */}
				<nav className="hidden md:flex items-center gap-1 flex-1">
					{navItems.map(({ to, label, icon: Icon, end }) => (
						<NavLink
							key={to}
							to={to}
							end={end}
							className={({ isActive }) =>
								cn(
									'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
									isActive
										? 'bg-accent text-accent-foreground'
										: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
								)
							}>
							<Icon className="h-4 w-4" />
							{label}
						</NavLink>
					))}
				</nav>

				{/* Desktop — user area */}
				<div className="ml-auto hidden md:flex items-center gap-2">
					{!loading &&
						(user ? (
							<>
								<Link
									to="/profile"
									className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
									<span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
										{userInitials}
									</span>
									<span>
										{user.firstName} {user.lastName}
									</span>
								</Link>
								<button
									type="button"
									onClick={handleLogout}
									className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
									<LogOut className="h-4 w-4" />
									Đăng xuất
								</button>
							</>
						) : (
							<Link
								to="/auth/login"
								className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
								<LogIn className="h-4 w-4" />
								Đăng nhập
							</Link>
						))}
				</div>

				{/* Mobile — user avatar */}
				<div className="ml-auto md:hidden flex items-center">
					{!loading &&
						(user ? (
							<Link
								to="/profile"
								className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
								{userInitials}
							</Link>
						) : (
							<Link
								to="/auth/login"
								className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
								<LogIn className="h-4 w-4" />
								Đăng nhập
							</Link>
						))}
				</div>
			</div>
		</header>
	);
}
