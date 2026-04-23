import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ApiException } from '~/apis/http';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { useAuth } from '~/contexts/auth-context';
import {
	useChangePasswordMutation,
	useUpdateProfileMutation,
} from '~/hooks/use-auth-mutations';

export function meta() {
	return [
		{ title: 'Hồ sơ cá nhân — Log Work' },
		{ name: 'description', content: 'Xem và cập nhật thông tin cá nhân' },
	];
}

const ROLE_LABEL: Record<string, string> = {
	USER: 'Người dùng',
	ADMIN: 'Quản trị viên',
};

export default function ProfilePage() {
	const { user, loading } = useAuth();
	const navigate = useNavigate();
	const passwordFormRef = useRef<HTMLFormElement>(null);

	useEffect(() => {
		if (!loading && !user) {
			navigate('/auth/login?redirect=/profile', { replace: true });
		}
	}, [user, loading, navigate]);

	const updateProfileMutation = useUpdateProfileMutation();
	const changePasswordMutation = useChangePasswordMutation();

	if (loading || !user) return null;

	function handleUpdateProfile(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const data = new FormData(e.currentTarget);
		updateProfileMutation.mutate({
			firstName: data.get('firstName') as string,
			lastName: data.get('lastName') as string,
			email: data.get('email') as string,
			languages: [],
		});
	}

	function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const data = new FormData(e.currentTarget);
		changePasswordMutation.mutate(
			{
				password: data.get('password') as string,
				newPassword: data.get('newPassword') as string,
				newPasswordConfirm: data.get('newPasswordConfirm') as string,
			},
			{ onSuccess: () => passwordFormRef.current?.reset() },
		);
	}

	return (
		<div className="max-w-2xl mx-auto space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
					{user.firstName[0]}
					{user.lastName[0]}
				</span>
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						{user.firstName} {user.lastName}
					</h1>
					<p className="text-sm text-muted-foreground">
						{ROLE_LABEL[user.role] ?? user.role} ·{' '}
						{user.isVerified ? (
							<span className="text-green-600">Đã xác thực</span>
						) : (
							<span className="text-yellow-600">Chưa xác thực email</span>
						)}
					</p>
				</div>
			</div>

			{/* Update profile */}
			<Card>
				<CardHeader>
					<CardTitle>Thông tin cá nhân</CardTitle>
					<CardDescription>Cập nhật họ tên và email của bạn.</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleUpdateProfile} className="space-y-4">
						{updateProfileMutation.isSuccess && (
							<Alert variant="success">
								<AlertDescription>
									Cập nhật thông tin thành công.
								</AlertDescription>
							</Alert>
						)}
						{updateProfileMutation.error && (
							<Alert variant="destructive">
								<AlertDescription>
									{updateProfileMutation.error instanceof ApiException
										? updateProfileMutation.error.message
										: 'Cập nhật thất bại.'}
								</AlertDescription>
							</Alert>
						)}

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label htmlFor="firstName">Họ</Label>
								<Input
									id="firstName"
									name="firstName"
									defaultValue={user.firstName}
									required
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="lastName">Tên</Label>
								<Input
									id="lastName"
									name="lastName"
									defaultValue={user.lastName}
									required
								/>
							</div>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								defaultValue={user.email}
								required
							/>
						</div>

						<Button type="submit" disabled={updateProfileMutation.isPending}>
							{updateProfileMutation.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
						</Button>
					</form>
				</CardContent>
			</Card>

			{/* Change password */}
			<Card>
				<CardHeader>
					<CardTitle>Đổi mật khẩu</CardTitle>
					<CardDescription>
						Nhập mật khẩu hiện tại và mật khẩu mới để thay đổi.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						ref={passwordFormRef}
						onSubmit={handleChangePassword}
						className="space-y-4">
						{changePasswordMutation.isSuccess && (
							<Alert variant="success">
								<AlertDescription>Đổi mật khẩu thành công.</AlertDescription>
							</Alert>
						)}
						{changePasswordMutation.error && (
							<Alert variant="destructive">
								<AlertDescription>
									{changePasswordMutation.error instanceof ApiException
										? changePasswordMutation.error.message
										: 'Đổi mật khẩu thất bại.'}
								</AlertDescription>
							</Alert>
						)}

						<div className="space-y-1.5">
							<Label htmlFor="password">Mật khẩu hiện tại</Label>
							<Input
								id="password"
								name="password"
								type="password"
								autoComplete="current-password"
								required
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="newPassword">Mật khẩu mới</Label>
							<Input
								id="newPassword"
								name="newPassword"
								type="password"
								autoComplete="new-password"
								required
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="newPasswordConfirm">Xác nhận mật khẩu mới</Label>
							<Input
								id="newPasswordConfirm"
								name="newPasswordConfirm"
								type="password"
								autoComplete="new-password"
								required
							/>
						</div>

						<Button type="submit" disabled={changePasswordMutation.isPending}>
							{changePasswordMutation.isPending ? 'Đang lưu…' : 'Đổi mật khẩu'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
