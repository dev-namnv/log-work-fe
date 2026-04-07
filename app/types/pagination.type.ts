interface Search {
	field: string;
	value: string | number | boolean;
}
enum SortOrder {
	ASC = 'asc',
	DESC = 'desc',
}
interface Sort {
	field: string;
	order: SortOrder;
}

export interface PaginationDto {
	page: number;
	limit: number;
	search?: Search[];
	sort?: Sort;
	keyword?: string;
}

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface ApiError {
	statusCode: number;
	message: string;
	error?: string;
}

export interface MessageResponse {
	message: string;
}
