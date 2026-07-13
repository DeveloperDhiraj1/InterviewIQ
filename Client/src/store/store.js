import { configureStore } from '@reduxjs/toolkit';
import gdRoomReducer from './slices/gdRoomSlice';

export const store = configureStore({
  reducer: {
    gdRoom: gdRoomReducer,
    // Add other reducers here as needed
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Useful if we ever store non-serializable objects (like socket/streams) though we avoid it
    }),
});

export default store;
