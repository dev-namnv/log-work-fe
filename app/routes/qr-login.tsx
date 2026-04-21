import { CheckCircle, Loader2, Monitor, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
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
import { useAuth } from '~/contexts/auth-context';

export function meta() {
	return [
		{ title: 'Xác nhận đăng nhập thiết bị — Log Work' },
		{
			name: 'description',
			content: 'Xác nhận đăng nhập cho thiết bị đồng hồ chấm công',
		},
	];
}

type ConfirmState = 'idle' | 'loading' | 'success' | 'error';

export default function QrLoginPage() {
	const [searchParams] = useSearchParams();
	const sessionId = searchParams.get('session');
	const { user, loading } = useAuth();

	const [state, setState] = useState<ConfirmState>('idle');
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	async function handleConfirm() {
		if (!sessionId) return;
		setState('loading');
		setErrorMsg(null);
		try {
			await AuthService.confirmQrSession(sessionId);
			setState('success');
		} catch (err) {
			setState('error');
			setErrorMsg(
				err instanceof ApiException
					? err.message
					: 'Đã xảy ra lỗi, vui lòng thử lại.',
			);
		}
	}

	// Đang tải thông tin người dùng
	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	// Không có sessionId trong URL
	if (!sessionId) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<Card className="w-full max-w-sm">
					<CardHeader className="text-center">
						<div className="flex justify-center mb-2">
							<XCircle className="h-12 w-12 text-destructive" />
						</div>
						<CardTitle>Liên kết không hợp lệ</CardTitle>
						<CardDescription>
							Mã phiên QR không được tìm thấy trong URL. Vui lòng quét lại mã QR
							trên thiết bị đồng hồ.
						</CardDescription>
					</CardHeader>
					<CardFooter>
						<Button asChild className="w-full">
							<Link to="/">Về trang chủ</Link>
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	// Chưa đăng nhập — yêu cầu đăng nhập trước
	if (!user) {
		const loginUrl = `/auth/login?redirect=${encodeURIComponent(`/qr-login?session=${sessionId}`)}`;
		return (
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<Card className="w-full max-w-sm">
					<CardHeader className="text-center">
						<div className="flex justify-center mb-2">
							<Monitor className="h-12 w-12 text-primary" />
						</div>
						<CardTitle>Xác nhận đăng nhập thiết bị</CardTitle>
						<CardDescription>
							Bạn cần đăng nhập tài khoản Log Work để xác nhận cho thiết bị đồng
							hồ chấm công.
						</CardDescription>
					</CardHeader>
					<CardFooter>
						<Button asChild className="w-full">
							<Link to={loginUrl}>Đăng nhập để xác nhận</Link>
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	// Đã xác nhận thành công
	if (state === 'success') {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<Card className="w-full max-w-sm">
					<CardHeader className="text-center">
						<div className="flex justify-center mb-2">
							<CheckCircle className="h-12 w-12 text-green-500" />
						</div>
						<CardTitle>Xác nhận thành công!</CardTitle>
						<CardDescription>
							Thiết bị đồng hồ đã được đăng nhập. Bạn có thể đóng trang này.
						</CardDescription>
					</CardHeader>
					<CardFooter>
						<Button asChild variant="outline" className="w-full">
							<Link to="/">Về trang chủ</Link>
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	// Màn hình xác nhận chính
	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<div className="flex justify-center mb-2">
						<Monitor className="h-12 w-12 text-primary" />
					</div>
					<CardTitle>Xác nhận đăng nhập thiết bị</CardTitle>
					<CardDescription>
						Bạn đang xác nhận đăng nhập cho một thiết bị đồng hồ chấm công với
						tài khoản{' '}
						<span className="font-medium text-foreground">
							{user.firstName} {user.lastName}
						</span>
						.
					</CardDescription>
				</CardHeader>

				<CardContent>
					{state === 'error' && errorMsg && (
						<Alert variant="destructive">
							<AlertDescription>{errorMsg}</AlertDescription>
						</Alert>
					)}
					<p className="text-sm text-muted-foreground text-center">
						Chỉ xác nhận nếu bạn đang đứng trước thiết bị đồng hồ và muốn đăng
						nhập vào thiết bị đó.
					</p>
				</CardContent>

				<CardFooter className="flex flex-col gap-2">
					<Button
						className="w-full"
						onClick={handleConfirm}
						disabled={state === 'loading'}>
						{state === 'loading' && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						Xác nhận đăng nhập thiết bị
					</Button>
					<Button asChild variant="ghost" className="w-full">
						<Link to="/">Huỷ</Link>
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
