import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AuthService } from '~/apis/auth.service';
import { setUser } from '~/store/auth.slice';
import { useAppDispatch, useAppSelector } from '~/store/hooks';
import type { Account } from '~/types';

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
	/**
	 * true khi redux-persist chưa rehydrate xong.
	 * Sau khi rehydrate, luôn là false — dùng để tránh flicker trên UI.
	 */
	loading: boolean;
	setUser: (user: Account | null) => void;
}

/**
 * Hook lấy thông tin người dùng hiện tại.
 *
 * - Nguồn dữ liệu chính: Redux store (được persist vào localStorage).
 *   Dữ liệu có ngay khi mount → không flicker.
 * - TanStack Query chạy nền để validate session với server.
 *   Nếu session hết hạn (trả null), Redux sẽ được cập nhật và user bị logout.
 */
export function useAuth(): AuthContextValue {
	const dispatch = useAppDispatch();
	const queryClient = useQueryClient();

	// Lấy từ Redux — đồng bộ, không cần chờ API
	const reduxUser = useAppSelector((s) => s.auth.user);
	const isHydrated = useAppSelector((s) => s.auth.isHydrated);

	// Validate session ngầm ở background — staleTime: Infinity không tự refetch
	const { data: serverUser } = useQuery({
		queryKey: CURRENT_USER_QUERY_KEY,
		queryFn: fetchCurrentUser,
		staleTime: Infinity,
		// Khởi tạo từ giá trị Redux để TanStack Query không coi là "chưa có dữ liệu"
		initialData: reduxUser ?? undefined,
	});

	// Đồng bộ kết quả từ server về Redux khi hoàn thành
	useEffect(() => {
		if (serverUser !== undefined && serverUser !== reduxUser) {
			dispatch(setUser(serverUser ?? null));
		}
	}, [serverUser, reduxUser, dispatch]);

	function handleSetUser(user: Account | null) {
		dispatch(setUser(user));
		queryClient.setQueryData<Account | null>(CURRENT_USER_QUERY_KEY, user);
	}

	return {
		user: reduxUser,
		// loading chỉ true khi chưa rehydrate từ localStorage lần đầu
		loading: !isHydrated,
		setUser: handleSetUser,
	};
}
