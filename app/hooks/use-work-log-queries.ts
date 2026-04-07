import { useQuery } from '@tanstack/react-query';
import type {
	MonthlyReportParams,
	OrgReportDto,
	SearchWorkLogDto,
} from '~/apis/work-log.service';
import { WorkLogService } from '~/apis/work-log.service';

export const WORK_LOG_KEYS = {
	all: ['work-logs'] as const,
	lists: () => [...WORK_LOG_KEYS.all, 'list'] as const,
	list: (dto: SearchWorkLogDto) => [...WORK_LOG_KEYS.lists(), dto] as const,
	details: () => [...WORK_LOG_KEYS.all, 'detail'] as const,
	detail: (id: string) => [...WORK_LOG_KEYS.details(), id] as const,
	monthlyReports: () => [...WORK_LOG_KEYS.all, 'monthly-report'] as const,
	monthlyReport: (params: MonthlyReportParams) =>
		[...WORK_LOG_KEYS.monthlyReports(), params] as const,
	orgReports: () => [...WORK_LOG_KEYS.all, 'org-report'] as const,
	orgReport: (dto: OrgReportDto) =>
		[...WORK_LOG_KEYS.orgReports(), dto] as const,
	shares: () => [...WORK_LOG_KEYS.all, 'shares'] as const,
	shareView: (token: string) =>
		[...WORK_LOG_KEYS.all, 'share-view', token] as const,
};

export function useWorkLogsQuery(dto: SearchWorkLogDto) {
	return useQuery({
		queryKey: WORK_LOG_KEYS.list(dto),
		queryFn: () => WorkLogService.search(dto),
	});
}

export function useWorkLogDetailQuery(id: string) {
	return useQuery({
		queryKey: WORK_LOG_KEYS.detail(id),
		queryFn: () => WorkLogService.getById(id),
		enabled: !!id,
	});
}

export function useMonthlyReportQuery(params: MonthlyReportParams) {
	return useQuery({
		queryKey: WORK_LOG_KEYS.monthlyReport(params),
		queryFn: () => WorkLogService.getMonthlyReport(params),
		enabled: !!params.month && !!params.year,
	});
}

export function useOrgReportQuery(dto: OrgReportDto) {
	return useQuery({
		queryKey: WORK_LOG_KEYS.orgReport(dto),
		queryFn: () => WorkLogService.getByOrganization(dto),
		enabled: !!dto.organizationId && !!dto.month && !!dto.year,
	});
}

export function useShareLinksQuery() {
	return useQuery({
		queryKey: WORK_LOG_KEYS.shares(),
		queryFn: () => WorkLogService.getShares(),
	});
}

export function useShareViewQuery(token: string) {
	return useQuery({
		queryKey: WORK_LOG_KEYS.shareView(token),
		queryFn: () => WorkLogService.viewShare(token),
		enabled: !!token,
		staleTime: 5 * 60 * 1000, // cache 5 min làm tải nhanh hơn khi share
		retry: false,
	});
}
