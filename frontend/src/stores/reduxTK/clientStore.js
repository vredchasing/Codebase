import { configureStore, combineReducers } from "@reduxjs/toolkit";
import uiReducer from "./slices/UI/uiSlice";
import userReducer from './slices/user/userSlice';
import workspaceSettingsReducer from './slices/workspace/workspaceSettingsSlice';

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
  whitelist: ["workspaceUI", "user", "workspaceSettings"], // only persist UI and user slices
};

const rootReducer = combineReducers({
  workspaceUI: uiReducer,
  user: userReducer,
  workspaceSettings: workspaceSettingsReducer,
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
