import { CheckCircle, Loader2, Monitor, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
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
import {
	useConfirmQrSessionMutation,
	useGetQrSessionStatusMutation,
} from '~/hooks/use-auth-mutations';

export function meta() {
	return [
		{ title: 'Xác nhận đăng nhập thiết bị — Log Work' },
		{
			name: 'description',
			content: 'Xác nhận đăng nhập cho thiết bị đồng hồ chấm công',
		},
	];
}

export default function QrLoginPage() {
	const [searchParams] = useSearchParams();
	const sessionId = searchParams.get('session');
	const { user, loading } = useAuth();

	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
	const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const {
		mutateAsync: getQrSessionStatus,
		data: qrSessionStatus,
		isPending: isGettingStatus,
	} = useGetQrSessionStatusMutation();
	const { mutate: confirmQrSession, isPending: isConfirming } =
		useConfirmQrSessionMutation();

	useEffect(() => {
		if (!sessionId) return;
		getQrSessionStatus(sessionId);
	}, [getQrSessionStatus, sessionId]);

	useEffect(() => {
		if (!qrSessionStatus?.expiresAt) return;

		function tick() {
			const diff = Math.max(
				0,
				Math.floor(
					(new Date(qrSessionStatus!.expiresAt).getTime() - Date.now()) / 1000,
				),
			);
			setRemainingSeconds(diff);
			if (diff <= 0 && countdownRef.current) {
				clearInterval(countdownRef.current);
			}
		}

		tick();
		countdownRef.current = setInterval(tick, 1000);
		return () => {
			if (countdownRef.current) clearInterval(countdownRef.current);
		};
	}, [qrSessionStatus?.expiresAt]);

	async function handleConfirm() {
		if (!sessionId) return;
		confirmQrSession(sessionId, {
			onSuccess: () => {
				setErrorMsg(null);
				// Sau khi xác nhận thành công, load lại trạng thái để hiển thị "confirmed"
				getQrSessionStatus(sessionId);
			},
			onError: (err) => {
				if (err instanceof ApiException) {
					setErrorMsg(err.message || 'Xác nhận thất bại. Vui lòng thử lại.');
				} else {
					setErrorMsg('Xác nhận thất bại. Vui lòng thử lại.');
				}
			},
		});
	}

	// Đang tải thông tin người dùng hoặc trạng thái phiên
	if (loading || isGettingStatus) {
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

	// Session đã hết hạn
	if (qrSessionStatus?.status === 'expired') {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<Card className="w-full max-w-sm">
					<CardHeader className="text-center">
						<div className="flex justify-center mb-2">
							<XCircle className="h-12 w-12 text-destructive" />
						</div>
						<CardTitle>Phiên đăng nhập đã hết hạn</CardTitle>
						<CardDescription>
							Phiên đăng nhập QR đã hết hạn. Vui lòng quét lại mã QR trên thiết
							bị đồng hồ.
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
	if (qrSessionStatus?.status === 'confirmed') {
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
						Bạn đang xác nhận đăng nhập cho một thiết bị chấm công với tài khoản{' '}
						<span className="font-medium text-foreground">
							{user.firstName} {user.lastName}
						</span>
						.
					</CardDescription>
				</CardHeader>

				<CardContent>
					{errorMsg && (
						<Alert variant="destructive">
							<AlertDescription>{errorMsg}</AlertDescription>
						</Alert>
					)}
					<p className="text-sm text-muted-foreground text-center">
						Chỉ xác nhận nếu bạn đang đứng trước thiết bị và muốn đăng nhập vào
						thiết bị đó.
					</p>
				</CardContent>

				<CardFooter className="flex flex-col gap-2">
					{remainingSeconds !== null && (
						<p className="text-xs text-muted-foreground text-center">
							Phiên hết hạn sau{' '}
							<span className="font-mono font-medium text-foreground">
								{String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:
								{String(remainingSeconds % 60).padStart(2, '0')}
							</span>
						</p>
					)}
					<Button
						className="w-full"
						onClick={handleConfirm}
						disabled={isConfirming}>
						{isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
