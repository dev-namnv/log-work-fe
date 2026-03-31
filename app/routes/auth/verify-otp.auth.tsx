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
import { useAuth } from '~/contexts/auth-context';
import { setToken } from '~/lib/token';

export function meta() {
	return [
		{ title: 'Xác thực OTP — Log Work' },
		{ name: 'description', content: 'Nhập mã OTP xác thực đăng nhập Admin' },
	];
}

export default function VerifyOtpPage() {
	const [searchParams] = useSearchParams();
	const email = searchParams.get('email') ?? '';
	const navigate = useNavigate();
	const { setUser } = useAuth();
	const [error, setError] = useState<string | null>(null);
	const [info, setInfo] = useState<string | null>(null);
	const [verifying, setVerifying] = useState(false);
	const [resending, setResending] = useState(false);

	if (!email) {
		navigate('/auth/login', { replace: true });
		return null;
	}

	async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setInfo(null);
		const otp = (new FormData(e.currentTarget).get('otp') as string) ?? '';
		setVerifying(true);
		try {
			const res = await AuthService.verifyOtp({ email, otp });
			setToken(res.accessToken);
			setUser(res.account);
			navigate('/');
		} catch (err) {
			setError(
				err instanceof ApiException
					? err.message
					: 'Mã OTP không hợp lệ hoặc đã hết hạn.',
			);
		} finally {
			setVerifying(false);
		}
	}

	async function handleResend() {
		setError(null);
		setInfo(null);
		setResending(true);
		try {
			await AuthService.resendOtp({ email });
			setInfo('Đã gửi lại mã OTP đến Telegram của bạn.');
		} catch (err) {
			setError(
				err instanceof ApiException ? err.message : 'Không thể gửi lại OTP.',
			);
		} finally {
			setResending(false);
		}
	}

	const isSubmitting = verifying;

	return (
		<Card className="w-full max-w-sm">
			<CardHeader className="text-center">
				<CardTitle>Xác thực hai bước</CardTitle>
				<CardDescription>
					Nhập mã OTP đã được gửi đến Telegram của bạn
				</CardDescription>
			</CardHeader>

			<CardContent>
				<form onSubmit={handleVerify} className="flex flex-col gap-4">
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					{info && (
						<Alert variant="success">
							<AlertDescription>{info}</AlertDescription>
						</Alert>
					)}

					<div className="flex flex-col gap-1.5">
						<Label htmlFor="otp">Mã OTP</Label>
						<Input
							id="otp"
							name="otp"
							type="text"
							inputMode="numeric"
							placeholder="000000"
							maxLength={6}
							autoComplete="one-time-code"
							className="text-center tracking-widest text-lg"
							required
						/>
					</div>

					<Button
						type="submit"
						className="w-full"
						disabled={verifying || resending}>
						{verifying ? 'Đang xác thực…' : 'Xác thực'}
					</Button>

					<Button
						type="button"
						variant="ghost"
						className="w-full text-muted-foreground"
						disabled={verifying || resending}
						onClick={handleResend}>
						{resending ? 'Đang gửi…' : 'Gửi lại mã OTP'}
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
