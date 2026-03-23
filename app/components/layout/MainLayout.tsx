import { Outlet } from 'react-router';
import AppShell from './AppShell';

// AuthContext không còn cần Provider ở đây —
// useAuth() tự lấy dữ liệu từ TanStack Query cache được cung cấp bởi QueryClientProvider trong root.tsx
export default function MainLayout() {
	return (
		<AppShell>
			<Outlet />
		</AppShell>
	);
}
