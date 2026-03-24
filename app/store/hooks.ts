import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './index';

/** Typed dispatch — dùng thay cho useDispatch() thông thường */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/** Typed selector — dùng thay cho useSelector() thông thường */
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
	useSelector(selector);
