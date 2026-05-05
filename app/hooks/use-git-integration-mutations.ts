import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GitIntegrationService } from '~/apis/git-integration.service';
import { GIT_INTEGRATION_KEYS } from './use-git-integration-queries';

export function useDeleteGitIntegrationMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => GitIntegrationService.deleteById(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: GIT_INTEGRATION_KEYS.list() });
		},
	});
}
