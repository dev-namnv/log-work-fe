import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthService } from '~/apis/auth.service';
import type { Account } from '~/types/api';

// Query key dùng chung để các mutation có thể invalidate / set cache
export const CURRENT_USER_QUERY_KEY = ['currentUser'] as const;

// Fetcher bắt lỗi 401 → trả null thay vì throw, tránh noise trong console
async function fetchCurrentUser(): Promise<Account | null> {
	try {
		return await AuthService.getProfile();
	} catch {
		return null;
	}
}

interface AuthContextValue {
	user: Account | null;
	loading: boolean;
	setUser: (user: Account | null) => void;
}

/**
 * Hook lấy thông tin người dùng hiện tại.
 * Dữ liệu được cache bởi TanStack Query — không tự refetch trừ khi bị invalidate.
 */
export function useAuth(): AuthContextValue {
	const queryClient = useQueryClient();

	const { data, isLoading } = useQuery({
		queryKey: CURRENT_USER_QUERY_KEY,
		queryFn: fetchCurrentUser,
		// Không tự stale — chỉ cập nhật khi login/logout/update profile
		staleTime: Infinity,
	});

	function setUser(user: Account | null) {
		queryClient.setQueryData<Account | null>(CURRENT_USER_QUERY_KEY, user);
	}

	return { user: data ?? null, loading: isLoading, setUser };
}
