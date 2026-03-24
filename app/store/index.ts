import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
	FLUSH,
	PAUSE,
	PERSIST,
	persistReducer,
	persistStore,
	PURGE,
	REGISTER,
	REHYDRATE,
} from 'redux-persist';
import Storage from 'redux-persist/lib/storage';
import { authSlice } from './auth.slice';

// ---------------------------------------------------------------------------
// SSR-safe storage: localStorage trên client, noop trên server
// ---------------------------------------------------------------------------
const noopStorage = {
	getItem: (_key: string) => Promise.resolve<string | null>(null),
	setItem: (_key: string, _value: string) => Promise.resolve(),
	removeItem: (_key: string) => Promise.resolve(),
};

const storage =
	typeof window !== 'undefined'
		? // eslint-disable-next-line @typescript-eslint/no-require-imports
			Storage
		: noopStorage;

// ---------------------------------------------------------------------------
// Persist config — chỉ lưu slice auth
// ---------------------------------------------------------------------------
const persistConfig = {
	key: 'log-work',
	version: 1,
	storage,
	whitelist: ['auth'],
};

const rootReducer = combineReducers({
	auth: authSlice.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				// Bỏ qua các action nội bộ của redux-persist
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
			},
		}),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
