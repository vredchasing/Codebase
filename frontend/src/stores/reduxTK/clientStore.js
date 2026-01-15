import { configureStore, combineReducers } from "@reduxjs/toolkit";
import uiReducer from "./slices/UI/uiSlice";

import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";

import storage from "redux-persist/lib/storage"; // localStorage

// Config for redux-persist
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["workspaceUI"], // only persist UI slice
};

const rootReducer = combineReducers({
  workspaceUI: uiReducer,
  // other reducers here
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // redux-persist action types to ignore
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
export default store;
