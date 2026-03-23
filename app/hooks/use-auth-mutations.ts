import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import type {
	ChangePasswordDto,
	LoginDto,
	RegisterDto,
	UpdateProfileDto,
} from '~/apis/auth.service';
import { AuthService } from '~/apis/auth.service';
import { ApiException } from '~/apis/http';
import { CURRENT_USER_QUERY_KEY, useAuth } from '~/contexts/auth-context';

export function useLoginMutation() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: LoginDto) => AuthService.login(dto),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
			navigate('/');
		},
		onError: (err: Error, variables: LoginDto) => {
			if (
				err instanceof ApiException &&
				(err.statusCode === 202 || err.message?.toLowerCase().includes('otp'))
			) {
				navigate(
					`/auth/verify-otp?email=${encodeURIComponent(variables.email)}`,
				);
			}
		},
	});
}

export function useRegisterMutation() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: RegisterDto) => AuthService.register(dto),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
			navigate('/');
		},
	});
}

export function useLogoutMutation() {
	const { setUser } = useAuth();
	const navigate = useNavigate();
	return useMutation({
		mutationFn: AuthService.logout,
		onSettled: () => {
			// Xóa cache user dù API thành công hay thất bại
			setUser(null);
			navigate('/auth/login');
		},
	});
}

export function useUpdateProfileMutation() {
	const { setUser } = useAuth();
	return useMutation({
		mutationFn: (dto: UpdateProfileDto) => AuthService.updateProfile(dto),
		onSuccess: (updated) => {
			setUser(updated);
		},
	});
}

export function useChangePasswordMutation() {
	return useMutation({
		mutationFn: (dto: ChangePasswordDto) => AuthService.changePassword(dto),
	});
}
