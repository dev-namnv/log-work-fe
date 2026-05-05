import { useQuery } from '@tanstack/react-query';
import { GitIntegrationService } from '~/apis/git-integration.service';

export const GIT_INTEGRATION_KEYS = {
	all: ['git-integrations'] as const,
	list: () => [...GIT_INTEGRATION_KEYS.all, 'list'] as const,
};

export function useGitIntegrationsQuery(options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: GIT_INTEGRATION_KEYS.list(),
		queryFn: () => GitIntegrationService.getAll(),
		...options,
	});
}
