import { useEffect } from 'react';
import { redirect } from 'react-router';
import { AuthService } from '~/apis/auth.service';
import { useAuth } from '~/contexts/auth-context';
import { removeToken } from '~/lib/token';

export default async function Logout() {
	const { setUser } = useAuth();

	const onLogout = async () => {
		await AuthService.logout();
		redirect('/auth/login');
		// Clear client-side token and user data
		removeToken();
		setUser(null);
	};

	useEffect(() => {
		onLogout();
	}, []);

	return (
		<div className="flex h-screen items-center justify-center">
			<div className="text-center">
				<h1 className="mb-4 text-2xl font-bold">Logging out...</h1>
				<p className="text-gray-600">Please wait while we log you out.</p>
			</div>
		</div>
	);
}
