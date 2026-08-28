// Format/parse số kiểu VN: nhóm nghìn bằng "." (10.000.000)
const vn = new Intl.NumberFormat('vi-VN');

export function formatNumber(n: number | null | undefined): string {
	if (n == null || Number.isNaN(n)) return '';
	return vn.format(n);
}

/** Bỏ mọi ký tự không phải số -> integer (0 nếu rỗng) */
export function parseNumber(s: string): number {
	const digits = s.replace(/\D/g, '');
	return digits ? Number(digits) : 0;
}

export function formatCurrency(n: number): string {
	return formatNumber(Math.round(n)) + ' đ';
}
