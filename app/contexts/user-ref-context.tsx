import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext } from 'react';
import { UserRefService } from '~/apis/user-ref.service';
import { USER_REF_KEYS, useUserRefQuery } from '~/hooks/use-user-ref-query';
import type { UserRef } from '~/types';
import { useAuth } from './auth-context';

interface UserRefContextValue {
	userRef: UserRef | null | undefined;
	isLoading: boolean;
	/** Gọi sau khi tạo WorkLog thành công để cập nhật tổ chức gần nhất */
	updateLastOrg: (orgId: string) => void;
}

const UserRefContext = createContext<UserRefContextValue>({
	userRef: undefined,
	isLoading: false,
	updateLastOrg: () => undefined,
});

export function UserRefProvider({ children }: { children: React.ReactNode }) {
	const { user, loading: authLoading } = useAuth();
	const authReady = !authLoading && !!user;
	const queryClient = useQueryClient();

	const { data: userRef, isLoading } = useUserRefQuery({ enabled: authReady });

	const updateLastOrg = useCallback(
		(orgId: string) => {
			// Optimistic update cache ngay lập tức
			queryClient.setQueryData<UserRef | null>(USER_REF_KEYS.all, (prev) => {
				if (!prev) return prev;
				return {
					...prev,
					lastWorkLogOrganization:
						prev.lastWorkLogOrganization?._id === orgId
							? prev.lastWorkLogOrganization
							: ({
									...prev.lastWorkLogOrganization,
									_id: orgId,
								} as UserRef['lastWorkLogOrganization']),
				};
			});
			// Gọi API nền — khi về sẽ cập nhật lại cache với dữ liệu đầy đủ
			UserRefService.patch({ lastWorkLogOrganization: orgId }).then(
				(updated) => {
					queryClient.setQueryData<UserRef | null>(USER_REF_KEYS.all, updated);
				},
			);
		},
		[queryClient],
	);

	return (
		<UserRefContext.Provider value={{ userRef, isLoading, updateLastOrg }}>
			{children}
		</UserRefContext.Provider>
	);
}

/**
 * Lấy UserRef đã fetch sẵn từ context.
 * - `undefined`: chưa load xong
 * - `null`: user chưa tạo WorkLog lần nào
 * - `UserRef`: có dữ liệu
 */
export function useUserRef(): UserRefContextValue {
	return useContext(UserRefContext);
}
