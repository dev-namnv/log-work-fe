import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Account } from '~/types/api';

interface AuthState {
	user: Account | null;
	/**
	 * true sau khi redux-persist đã rehydrate xong từ localStorage.
	 * Dùng để phân biệt "chưa có dữ liệu" vs "đã biết là chưa đăng nhập".
	 */
	isHydrated: boolean;
}

const initialState: AuthState = {
	user: null,
	isHydrated: false,
};

export const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		setUser(state, action: PayloadAction<Account | null>) {
			state.user = action.payload;
		},
		/** Gọi thủ công khi không dùng PersistGate (SSR-safe) */
		setHydrated(state) {
			state.isHydrated = true;
		},
	},
	extraReducers: (builder) => {
		// Khi redux-persist rehydrate xong, đánh dấu isHydrated = true
		builder.addCase('persist/REHYDRATE', (state, action) => {
			const payload = (
				action as PayloadAction<{ auth?: AuthState } | undefined>
			).payload;
			if (payload?.auth?.user !== undefined) {
				state.user = payload.auth.user;
			}
			state.isHydrated = true;
		});
	},
});

export const { setUser, setHydrated } = authSlice.actions;
