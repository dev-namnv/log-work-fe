/** ISO datetime → "HH:mm" theo giờ Việt Nam */
export function toTimeString(iso: string | null): string {
	if (!iso) return '';
	return new Date(iso).toLocaleTimeString('en-GB', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
		timeZone: 'Asia/Ho_Chi_Minh',
	});
}

/** ISO datetime → "YYYY-MM-DD" theo giờ Việt Nam */
export function toDateString(iso: string): string {
	return new Date(iso).toLocaleDateString('en-CA', {
		timeZone: 'Asia/Ho_Chi_Minh',
	});
}

/** ISO datetime → "YYYY-MM-DDTHH:mm:ss" theo giờ Việt Nam */
export function toISO(date: string, time: string): string {
	return new Date(`${date}T${time}:00+07:00`).toISOString();
}

/** "YYYY-MM-DDTHH:mm:ss" → "YYYY-MM-DDTHH:mm:ss" theo giờ Việt Nam */
export function formatDateVN(iso: string) {
	return new Date(iso).toLocaleDateString('vi-VN', {
		weekday: 'long',
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
}

/** "YYYY-MM-DDTHH:mm:ss" → "YYYY-MM-DDTHH:mm:ss" theo giờ Việt Nam */
export function isoToHHmm(iso: string | null): string {
	if (!iso) return '—';
	return new Date(iso).toLocaleTimeString('vi-VN', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	});
}

/** "YYYY-MM-DDTHH:mm:ss" → "YYYY-MM-DDTHH:mm:ss" theo giờ Việt Nam */
export function isoToDDMM(iso: string): string {
	return new Date(iso).toLocaleDateString('vi-VN', {
		day: '2-digit',
		month: '2-digit',
	});
}

/** "YYYY-MM-DDTHH:mm:ss" → "YYYY-MM-DDTHH:mm:ss" theo giờ Việt Nam */
export function isoToWeekday(iso: string): string {
	return new Date(iso).toLocaleDateString('vi-VN', { weekday: 'short' });
}

/** YYYY-MM-DD theo múi giờ Việt Nam */
export function localDateStr(d: Date = new Date()): string {
	return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}

/** HH:mm:ss theo múi giờ Việt Nam */
export function localTimeStr(d: Date = new Date()): string {
	return d.toLocaleTimeString('vi-VN', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
		timeZone: 'Asia/Ho_Chi_Minh',
	});
}

/** dd/mm từ ISO (múi giờ Việt Nam) */
export function isoToDateShort(iso: string): string {
	return new Date(iso).toLocaleDateString('vi-VN', {
		day: '2-digit',
		month: '2-digit',
		timeZone: 'Asia/Ho_Chi_Minh',
	});
}
