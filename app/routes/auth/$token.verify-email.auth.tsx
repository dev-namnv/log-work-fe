import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { AuthService } from '~/apis/auth.service';
import { ApiException } from '~/apis/http';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card';

export function meta() {
	return [
		{ title: 'Xác thực email — Log Work' },
		{ name: 'description', content: 'Xác thực địa chỉ email của bạn' },
	];
}

export default function VerifyEmailPage() {
	const { token } = useParams<{ token: string }>();
	const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
		'loading',
	);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!token) {
			setStatus('error');
			setError('Token không hợp lệ.');
			return;
		}
		AuthService.verifyEmail(token)
			.then(() => setStatus('success'))
			.catch((err) => {
				setStatus('error');
				setError(
					err instanceof ApiException
						? err.message
						: 'Xác thực thất bại, vui lòng thử lại.',
				);
			});
	}, [token]);

	if (status === 'loading') {
		return (
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<CardTitle>Đang xác thực…</CardTitle>
					<CardDescription>Vui lòng chờ trong giây lát.</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<Card className="w-full max-w-sm">
			<CardHeader className="text-center">
				<CardTitle>
					{status === 'success' ? 'Email đã xác thực' : 'Xác thực thất bại'}
				</CardTitle>
				<CardDescription>
					{status === 'success'
						? 'Tài khoản của bạn đã được xác thực thành công.'
						: 'Không thể xác thực email của bạn.'}
				</CardDescription>
			</CardHeader>

			{status === 'error' && error && (
				<CardContent>
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				</CardContent>
			)}

			<CardFooter className="justify-center">
				{status === 'success' ? (
					<Link to="/auth/login">
						<Button>Đăng nhập ngay</Button>
					</Link>
				) : (
					<Link to="/auth/login">
						<Button variant="outline">Quay lại đăng nhập</Button>
					</Link>
				)}
			</CardFooter>
		</Card>
	);
}
