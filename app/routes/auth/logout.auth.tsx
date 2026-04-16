import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AuthService } from '~/apis/auth.service';
import { removeToken } from '~/lib/token';
import { store } from '~/store';
import { setUser } from '~/store/auth.slice';

export default function LogoutPage() {
	const navigate = useNavigate();

	useEffect(() => {
		const performLogout = async () => {
			try {
				// Gọi API logout
				await AuthService.logout();
			} catch (err) {
				// Nếu API error, vẫn logout client-side
				console.error('Logout error:', err);
			}

			// Clear token và Redux state
			removeToken();
			store.dispatch(setUser(null));

			// Redirect về login
			navigate('/auth/login', { replace: true });
		};

		performLogout();
	}, [navigate]);

	return (
		<div className="flex h-screen items-center justify-center">
			<div className="text-center">
				<h1 className="mb-4 text-2xl font-bold">Đang đăng xuất...</h1>
				<p className="text-gray-600">Vui lòng chờ một lát.</p>
			</div>
		</div>
	);
}
