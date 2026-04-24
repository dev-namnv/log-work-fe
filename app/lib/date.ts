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

export function toISO(date: string, time: string): string {
	return new Date(`${date}T${time}:00+07:00`).toISOString();
}

export function formatDateVN(iso: string) {
	return new Date(iso).toLocaleDateString('vi-VN', {
		weekday: 'long',
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
}
