import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import type {
	CreateOrganizationDto,
	MemberDto,
	UpdateOrganizationDto,
	UpdateWorkScheduleDto,
} from '~/apis/organization.service';
import { OrganizationService } from '~/apis/organization.service';
import { ORGANIZATION_KEYS } from './use-organization-queries';

export function useCreateOrganizationMutation() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	return useMutation({
		mutationFn: (dto: CreateOrganizationDto) => OrganizationService.create(dto),
		onSuccess: (org) => {
			queryClient.invalidateQueries({ queryKey: ORGANIZATION_KEYS.lists() });
			navigate(`/organizations/${org._id}`);
		},
	});
}

export function useUpdateOrganizationMutation(id: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: UpdateOrganizationDto) =>
			OrganizationService.update(id, dto),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ORGANIZATION_KEYS.detail(id) });
			queryClient.invalidateQueries({ queryKey: ORGANIZATION_KEYS.lists() });
		},
	});
}

export function useDeleteOrganizationMutation() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	return useMutation({
		mutationFn: (id: string) => OrganizationService.deleteById(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ORGANIZATION_KEYS.lists() });
			navigate('/organizations');
		},
	});
}

export function useAddMemberMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: MemberDto) => OrganizationService.addMember(orgId, dto),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ORGANIZATION_KEYS.detail(orgId),
			});
		},
	});
}

export function useRemoveMemberMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: MemberDto) =>
			OrganizationService.removeMember(orgId, dto),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ORGANIZATION_KEYS.detail(orgId),
			});
		},
	});
}

export function useUpdateWorkScheduleMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: UpdateWorkScheduleDto) =>
			OrganizationService.updateWorkSchedule(orgId, dto),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ORGANIZATION_KEYS.detail(orgId),
			});
		},
	});
}
