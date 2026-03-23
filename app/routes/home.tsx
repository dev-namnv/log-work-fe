import { Link } from 'react-router';
import { useAuth } from '~/contexts/auth-context';
import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Tổng quan — Log Work' },
		{ name: 'description', content: 'Hệ thống quản lý chấm công' },
	];
}

export default function Home() {
	const { user } = useAuth();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Tổng quan</h1>
				<p className="text-sm text-muted-foreground mt-1">
					{user
						? `Xin chào, ${user.firstName} ${user.lastName}! Chào mừng trở lại.`
						: 'Chào mừng đến với hệ thống quản lý chấm công Log Work.'}
				</p>
			</div>
			{!user && (
				<div className="flex items-center gap-3">
					<Link
						to="/auth/login"
						className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors">
						Đăng nhập
					</Link>
					<Link
						to="/auth/register"
						className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground transition-colors">
						Tạo tài khoản
					</Link>
				</div>
			)}
		</div>
	);
}
