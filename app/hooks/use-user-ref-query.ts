import { useQuery } from '@tanstack/react-query';
import { UserRefService } from '~/apis/user-ref.service';

export const USER_REF_KEYS = {
	all: ['user-ref'] as const,
};

export function useUserRefQuery(options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: USER_REF_KEYS.all,
		queryFn: () => UserRefService.get(),
		staleTime: 1000 * 60 * 5, // 5 phút
		...options,
	});
}
