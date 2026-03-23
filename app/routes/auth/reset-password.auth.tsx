import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
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

export function meta() {
	return [
		{ title: 'Đặt lại mật khẩu — Log Work' },
		{ name: 'description', content: 'Tạo mật khẩu mới cho tài khoản của bạn' },
	];
}

export default function ResetPasswordPage() {
	const [searchParams] = useSearchParams();
	const key = searchParams.get('key');
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	if (!key) {
		return (
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<CardTitle>Liên kết không hợp lệ</CardTitle>
					<CardDescription>
						Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.
					</CardDescription>
				</CardHeader>
				<CardFooter className="justify-center">
					<Link to="/auth/forgot-password">
						<Button variant="outline">Yêu cầu liên kết mới</Button>
					</Link>
				</CardFooter>
			</Card>
		);
	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		const data = new FormData(e.currentTarget);
		const password = data.get('password') as string;
		const passwordConfirm = data.get('passwordConfirm') as string;

		if (password !== passwordConfirm) {
			setError('Mật khẩu xác nhận không khớp.');
			return;
		}

		setLoading(true);
		try {
			await AuthService.resetPassword({ key: key!, password });
			navigate('/auth/login?reset=success');
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

	const isSubmitting = loading;

	return (
		<Card className="w-full max-w-sm">
			<CardHeader className="text-center">
				<CardTitle>Đặt lại mật khẩu</CardTitle>
				<CardDescription>
					Tạo mật khẩu mới cho tài khoản của bạn
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
						<Label htmlFor="password">Mật khẩu mới</Label>
						<Input
							id="password"
							name="password"
							type="password"
							placeholder="Tối thiểu 6 ký tự"
							autoComplete="new-password"
							minLength={6}
							required
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor="passwordConfirm">Xác nhận mật khẩu</Label>
						<Input
							id="passwordConfirm"
							name="passwordConfirm"
							type="password"
							placeholder="Nhập lại mật khẩu"
							autoComplete="new-password"
							minLength={6}
							required
						/>
					</div>

					<Button type="submit" className="w-full" disabled={isSubmitting}>
						{isSubmitting ? 'Đang cập nhật…' : 'Cập nhật mật khẩu'}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
