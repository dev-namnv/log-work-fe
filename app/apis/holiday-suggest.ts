// Gợi ý ngày lễ VN từ Nager.Date (public, không cần key, CORS *).
// Chỉ để seed — thiếu ngày nghỉ bù/hoán đổi, admin vẫn phải chỉnh tay.
export interface HolidaySuggestion {
	date: string; // "YYYY-MM-DD"
	name: string;
}

export async function fetchVnHolidays(
	year: number,
): Promise<HolidaySuggestion[]> {
	const res = await fetch(
		`https://date.nager.at/api/v3/PublicHolidays/${year}/VN`,
	);
	if (!res.ok) throw new Error('Không tải được gợi ý ngày lễ');
	const data: { date: string; localName: string; name: string }[] =
		await res.json();
	return data.map((h) => ({ date: h.date, name: h.localName || h.name }));
}
