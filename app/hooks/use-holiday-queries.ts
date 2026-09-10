import { useQuery } from '@tanstack/react-query';
import { HolidayService } from '~/apis/holiday.service';

export const HOLIDAY_KEYS = {
	all: ['holidays'] as const,
	lists: () => [...HOLIDAY_KEYS.all, 'list'] as const,
	year: (year: number) => [...HOLIDAY_KEYS.lists(), year] as const,
};

export function useHolidaysQuery(year: number) {
	return useQuery({
		queryKey: HOLIDAY_KEYS.year(year),
		queryFn: () => HolidayService.listByYear(year),
	});
}
