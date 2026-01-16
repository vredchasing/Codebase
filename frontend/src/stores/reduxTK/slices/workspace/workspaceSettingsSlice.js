import { createSlice } from "@reduxjs/toolkit";

export const AGENT_SETTINGS_TAB = "__AGENT_SETTINGS__";

const initialState ={
  tabName : 'Agent Settings',
  workspaceSettings : {
    crossProjectRetrieval: false,
    addedProjects: [],
    agentApproach: 'quick',
    autoApplyPatches: true,
    preventAutoDeletes: false,
  }
}

const workspaceSettingsSlice = createSlice({
  name: "workspaceSettings",
  initialState,
  reducers: {
    setWorkspaceSettings(state, action) {
      state.workspaceSettings = action.payload;
    },
    clearWorkspaceSettings(state) {
      return initialState;
    },
  }
})

export const { setWorkspaceSettings, clearWorkspaceSettings } = workspaceSettingsSlice.actions;
export default workspaceSettingsSlice.reducer;