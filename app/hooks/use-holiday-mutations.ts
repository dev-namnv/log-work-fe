import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { UpsertHolidayDto } from '~/apis/holiday.service';
import { HolidayService } from '~/apis/holiday.service';
import { ApiException } from '~/apis/http';
import { HOLIDAY_KEYS } from './use-holiday-queries';

const onError = (e: unknown) =>
	toast.error(e instanceof ApiException ? e.message : 'Đã có lỗi xảy ra.');

export function useCreateHolidayMutation() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (dto: UpsertHolidayDto) => HolidayService.create(dto),
		onSuccess: () => qc.invalidateQueries({ queryKey: HOLIDAY_KEYS.lists() }),
		onError,
	});
}

export function useUpdateHolidayMutation() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, dto }: { id: string; dto: UpsertHolidayDto }) =>
			HolidayService.update(id, dto),
		onSuccess: () => qc.invalidateQueries({ queryKey: HOLIDAY_KEYS.lists() }),
		onError,
	});
}

export function useDeleteHolidayMutation() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => HolidayService.remove(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: HOLIDAY_KEYS.lists() }),
		onError,
	});
}
