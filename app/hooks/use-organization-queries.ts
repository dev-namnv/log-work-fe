import { useQuery } from '@tanstack/react-query';
import type { SearchOrganizationDto } from '~/apis/organization.service';
import { OrganizationService } from '~/apis/organization.service';

export const ORGANIZATION_KEYS = {
	all: ['organizations'] as const,
	lists: () => [...ORGANIZATION_KEYS.all, 'list'] as const,
	list: (dto: SearchOrganizationDto) =>
		[...ORGANIZATION_KEYS.lists(), dto] as const,
	details: () => [...ORGANIZATION_KEYS.all, 'detail'] as const,
	detail: (id: string) => [...ORGANIZATION_KEYS.details(), id] as const,
};

export function useOrganizationsQuery(
	dto: SearchOrganizationDto = {},
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: ORGANIZATION_KEYS.list(dto),
		queryFn: () => OrganizationService.search(dto),
		...options,
	});
}

export function useOrganizationDetailQuery(id: string) {
	return useQuery({
		queryKey: ORGANIZATION_KEYS.detail(id),
		queryFn: () => OrganizationService.getById(id),
		enabled: !!id,
	});
}
