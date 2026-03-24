import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import type {
	CreateShareDto,
	CreateWorkLogDto,
	UpdateWorkLogDto,
} from '~/apis/work-log.service';
import { WorkLogService } from '~/apis/work-log.service';
import { WORK_LOG_KEYS } from './use-work-log-queries';

export function useCreateWorkLogMutation() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	return useMutation({
		mutationFn: (dto: CreateWorkLogDto) => WorkLogService.create(dto),
		onSuccess: (log) => {
			queryClient.invalidateQueries({ queryKey: WORK_LOG_KEYS.lists() });
			queryClient.invalidateQueries({
				queryKey: WORK_LOG_KEYS.monthlyReports(),
			});
			navigate(`/work-logs/${log._id}`);
		},
	});
}

export function useUpdateWorkLogMutation(id: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: UpdateWorkLogDto) => WorkLogService.update(id, dto),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: WORK_LOG_KEYS.detail(id) });
			queryClient.invalidateQueries({ queryKey: WORK_LOG_KEYS.lists() });
			queryClient.invalidateQueries({
				queryKey: WORK_LOG_KEYS.monthlyReports(),
			});
		},
	});
}

export function useDeleteWorkLogMutation() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	return useMutation({
		mutationFn: (id: string) => WorkLogService.deleteById(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: WORK_LOG_KEYS.lists() });
			queryClient.invalidateQueries({
				queryKey: WORK_LOG_KEYS.monthlyReports(),
			});
			navigate('/work-logs');
		},
	});
}

export function useCreateShareMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: CreateShareDto) => WorkLogService.createShare(dto),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: WORK_LOG_KEYS.shares() });
		},
	});
}

export function useRevokeShareMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => WorkLogService.revokeShare(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: WORK_LOG_KEYS.shares() });
		},
	});
}
