// src/stores/reduxTK/slices/UI/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  hydrated: false,
  general: {
    theme: 'light',
    reducedMotion: false,
    sidebarCollapsed: false,
  },
  workspace: {
    projectId: null,
    openedTabs: [],
    activeTab: null,
    scrollPositions: {},
    expandedFolders: [],
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    hydrateWorkspaceUI(state, action) {
      return {
        ...state,
        ...action.payload,
        hydrated: true,
      };
    },
    setTheme(state, action) {
      state.general.theme = action.payload;
    },
    setReducedMotion(state, action) {
      state.general.reducedMotion = action.payload;
    },
    toggleSidebar(state) {
      state.general.sidebarCollapsed = !state.general.sidebarCollapsed;
    },
    setWorkspaceProject(state, action) {
      state.workspace.projectId = action.payload;
    },
    setOpenedTabs(state, action) {
      state.workspace.openedTabs = action.payload;
    },
    setActiveTab(state, action) {
      state.workspace.activeTab = action.payload;
    },
    setScrollPosition(state, action) {
      const { fileId, position } = action.payload;
      state.workspace.scrollPositions[fileId] = position;
    },
    setExpandedFolders(state, action) {
      state.workspace.expandedFolders = action.payload;
    },
    resetWorkspaceUI(state) {
      state.workspace = initialState.workspace;
    },
    resetUI() {
      return initialState;
    },
  },
});

export const {
  hydrateWorkspaceUI,
  setTheme,
  setReducedMotion,
  toggleSidebar,
  setWorkspaceProject,
  setOpenedTabs,
  setActiveTab,
  setScrollPosition,
  setExpandedFolders,
  resetWorkspaceUI,
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;
