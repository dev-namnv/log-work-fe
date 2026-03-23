import { ClipboardCheck } from 'lucide-react';
import { Link, Outlet } from 'react-router';

export default function AuthLayout() {
	return (
		<div className="flex min-h-screen flex-col bg-muted/40">
			{/* Top bar */}
			<header className="flex h-14 items-center px-6 border-b border-border bg-background">
				<Link to="/" className="flex items-center gap-2">
					<div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
						<ClipboardCheck className="h-4 w-4 text-primary-foreground" />
					</div>
					<span className="font-semibold text-sm">Log Work</span>
				</Link>
			</header>

			{/* Content */}
			<main className="flex flex-1 items-center justify-center px-4 py-12">
				<Outlet />
			</main>

			{/* Footer */}
			<footer className="flex h-12 items-center justify-center border-t border-border bg-background">
				<p className="text-xs text-muted-foreground">
					© {new Date().getFullYear()} Log Work — Hệ thống quản lý chấm công
				</p>
			</footer>
		</div>
	);
}
