import { type FormEvent, useState } from 'react';
import { Link } from 'react-router';
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
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import type { Route } from './+types/forgot-password.auth';

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Quên mật khẩu — Log Work' },
		{ name: 'description', content: 'Gửi yêu cầu đặt lại mật khẩu' },
	];
}

export default function ForgotPasswordPage() {
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const email = new FormData(e.currentTarget).get('email') as string;
		setError(null);
		setLoading(true);
		try {
			await AuthService.forgotPassword({ email });
			setSuccess(true);
		} catch (err) {
			setError(
				err instanceof ApiException
					? err.message
					: 'Đã xảy ra lỗi, vui lòng thử lại.',
			);
		} finally {
			setLoading(false);
		}
	}

	if (success) {
		return (
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<CardTitle>Kiểm tra email</CardTitle>
					<CardDescription>
						Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn.
					</CardDescription>
				</CardHeader>
				<CardFooter className="justify-center">
					<Link to="/auth/login">
						<Button variant="outline">Quay lại đăng nhập</Button>
					</Link>
				</CardFooter>
			</Card>
		);
	}

	return (
		<Card className="w-full max-w-sm">
			<CardHeader className="text-center">
				<CardTitle>Quên mật khẩu</CardTitle>
				<CardDescription>
					Nhập email để nhận link đặt lại mật khẩu
				</CardDescription>
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

					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? 'Đang gửi…' : 'Gửi link đặt lại'}
					</Button>
				</form>
			</CardContent>

			<CardFooter className="justify-center text-sm text-muted-foreground">
				<Link
					to="/auth/login"
					className="font-medium text-foreground hover:underline">
					← Quay lại đăng nhập
				</Link>
			</CardFooter>
		</Card>
	);
}
