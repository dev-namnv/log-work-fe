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
import { useRegisterMutation } from '~/hooks/use-auth-mutations';
import type { Route } from './+types/register.auth';

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Đăng ký — Log Work' },
		{ name: 'description', content: 'Tạo tài khoản mới' },
	];
}

export default function RegisterPage() {
	const {
		mutate: register,
		isPending,
		error: mutationError,
	} = useRegisterMutation();

	const error =
		mutationError instanceof ApiException
			? mutationError.message
			: mutationError
				? 'Đã xảy ra lỗi, vui lòng thử lại.'
				: null;

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const data = new FormData(e.currentTarget);
		register({
			firstName: data.get('firstName') as string,
			lastName: data.get('lastName') as string,
			email: data.get('email') as string,
			password: data.get('password') as string,
			inviteCode: (data.get('inviteCode') as string) || undefined,
		});
	}

	return (
		<Card className="w-full max-w-sm">
			<CardHeader className="text-center">
				<CardTitle>Tạo tài khoản</CardTitle>
				<CardDescription>Điền thông tin bên dưới để đăng ký</CardDescription>
			</CardHeader>

			<CardContent>
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<div className="grid grid-cols-2 gap-3">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="firstName">Họ</Label>
							<Input
								id="firstName"
								name="firstName"
								placeholder="Nguyễn"
								autoComplete="given-name"
								required
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="lastName">Tên</Label>
							<Input
								id="lastName"
								name="lastName"
								placeholder="Văn A"
								autoComplete="family-name"
								required
							/>
						</div>
					</div>

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
						<Label htmlFor="password">Mật khẩu</Label>
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

					<Button type="submit" className="w-full" disabled={isPending}>
						{isPending ? 'Đang đăng ký…' : 'Đăng ký'}
					</Button>
				</form>
			</CardContent>

			<CardFooter className="justify-center text-sm text-muted-foreground">
				Đã có tài khoản?&nbsp;
				<Link
					to="/auth/login"
					className="font-medium text-foreground hover:underline">
					Đăng nhập
				</Link>
			</CardFooter>
		</Card>
	);
}
