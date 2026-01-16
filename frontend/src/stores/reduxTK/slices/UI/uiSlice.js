// src/stores/reduxTK/slices/UI/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { AGENT_SETTINGS_TAB } from '../workspace/workspaceSettingsSlice';

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

    // ——— editor tab logic ———

    openSettingsTab(state) {
      const exists = state.workspace.openedTabs.some(
        (t) => t.id === AGENT_SETTINGS_TAB
      );
      if (!exists) {
        state.workspace.openedTabs.push({
          id: AGENT_SETTINGS_TAB,
          name: "Agent Settings",
        });
      }
      state.workspace.activeTab = AGENT_SETTINGS_TAB;
    },

    closeTab(state, action) {
      const tabId = action.payload;
      state.workspace.openedTabs = state.workspace.openedTabs.filter(
        (t) => t.id !== tabId
      );

      // If active tab was closed, pick the last one
      if (state.workspace.activeTab === tabId) {
        const lastTab = state.workspace.openedTabs.at(-1);
        state.workspace.activeTab = lastTab ? lastTab.id : null;
      }
    },

    setActiveTab(state, action) {
      state.workspace.activeTab = action.payload;
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
  setScrollPosition,
  setExpandedFolders,
  resetWorkspaceUI,
  resetUI,
  openSettingsTab,
  closeTab,
  setActiveTab,
} = uiSlice.actions;

export default uiSlice.reducer;
