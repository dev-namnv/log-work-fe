import { Outlet } from 'react-router';
import { UserRefProvider } from '~/contexts/user-ref-context';
import AppShell from './AppShell';

export default function MainLayout() {
	return (
		<UserRefProvider>
			<AppShell>
				<Outlet />
			</AppShell>
		</UserRefProvider>
	);
}
