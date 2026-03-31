import { useEffect } from 'react';
import { Link } from 'react-router';
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
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { useAuth } from '~/contexts/auth-context';
import { useLoginMutation } from '~/hooks/use-auth-mutations';
import type { Route } from './+types/login.auth';

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Đăng nhập — Log Work' },
		{
			name: 'description',
			content: 'Đăng nhập vào hệ thống quản lý chấm công',
		},
	];
}

export default function LoginPage() {
	const { mutate: login, isPending, error: mutationError } = useLoginMutation();
	const { loading, user } = useAuth();

	// Ẩn lỗi khi trường hợp OTP redirect — sẽ navigate thay vì hiển thị
	const isOtpCase =
		mutationError instanceof ApiException &&
		(mutationError.statusCode === 202 ||
			mutationError.message?.toLowerCase().includes('otp'));
	const error = isOtpCase
		? null
		: mutationError instanceof ApiException
			? mutationError.message
			: mutationError
				? 'Đã xảy ra lỗi, vui lòng thử lại.'
				: null;

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const data = new FormData(e.currentTarget);
		login({
			email: data.get('email') as string,
			password: data.get('password') as string,
		});
	}

	useEffect(() => {
		if (!loading && user) {
			// Nếu đã có user, điều hướng về trang chủ
			window.location.href = '/';
		}
	}, [loading, user]);

	return (
		<Card className="w-full max-w-sm">
			<CardHeader className="text-center">
				<CardTitle>Đăng nhập</CardTitle>
				<CardDescription>Nhập email và mật khẩu để tiếp tục</CardDescription>
			</CardHeader>

			<CardContent>
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<div className="flex flex-col gap-1.5">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							name="email"
							type="email"
							placeholder="name@example.com"
							autoComplete="email"
							required
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<div className="flex items-center justify-between">
							<Label htmlFor="password">Mật khẩu</Label>
							<Link
								to="/auth/forgot-password"
								className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
								Quên mật khẩu?
							</Link>
						</div>
						<Input
							id="password"
							name="password"
							type="password"
							placeholder="••••••••"
							autoComplete="current-password"
							required
						/>
					</div>

					<Button type="submit" className="w-full" disabled={isPending}>
						{isPending ? 'Đang đăng nhập…' : 'Đăng nhập'}
					</Button>
				</form>
			</CardContent>

			<CardFooter className="justify-center text-sm text-muted-foreground">
				Chưa có tài khoản?&nbsp;
				<Link
					to="/auth/register"
					className="font-medium text-foreground hover:underline">
					Đăng ký
				</Link>
			</CardFooter>
		</Card>
	);
}
