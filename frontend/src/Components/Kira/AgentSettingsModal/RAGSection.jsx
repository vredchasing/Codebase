import React from "react";
import { useSelector, useDispatch } from "react-redux";
import IosSlider from "./iosSlider";
import { setWorkspaceSettings } from "../../../stores/reduxTK/slices/workspace/workspaceSettingsSlice";
import "./AgentSettingsTab.css";
import { RiExpandUpDownLine } from "react-icons/ri";

function RAGSection() {
  const dispatch = useDispatch();

  // pull out the full workspaceSettings object
  const workspaceSettings = useSelector(
    (state) => state.workspaceSettings.workspaceSettings
  );

  // get the specific toggle field
  const crossProjectRetrieval =
    workspaceSettings?.crossProjectRetrieval ?? false;

  // toggle handler — uses the selector result above
  const handleCrossProjectToggle = () => {
    dispatch(
      setWorkspaceSettings({
        ...workspaceSettings,                     // use the variable you already selected
        crossProjectRetrieval: !crossProjectRetrieval,
      })
    );
  };



  return (
    <div className="agent-settings-section-content">
      <div className="agent-settings-section-main-header">
        <h3>Agents</h3>
      </div>

      <div className="agent-settings-section-inner-content-container">
        <div className="agent-settings-section-inner-content">
          <div className="agent-settings-section">
            <div className="agent-settings-section-title">
              <span className="agent-settings-toggle-label">
                Enable Cross Project Retrieval
              </span>
              <p className="agent-settings-description">
                Search across multiple projects and files
              </p>
            </div>
            <IosSlider
              checked={crossProjectRetrieval}
              onChange={handleCrossProjectToggle}
            />
          </div>
          <div className="agent-settings-section">
            <div className="agent-settings-section-title">
              <span className="agent-settings-toggle-label">
                Default Approach
              </span>
              <p className="agent-settings-description v2">
                Choose between quick or more thorough, higher-cost analysis
              </p>
            </div>
            <div className="agent-settings-select-container">
              {workspaceSettings?.agentApproach === 'quick' ? (
                <span className="agent-settings-select-item">Quick<RiExpandUpDownLine size={14} color="rgba(232, 232, 232, 0.7)"></RiExpandUpDownLine></span>
              ) : (
                <span className="agent-settings-select-item">Deep</span>
              )}
            </div>
          </div>
          <div className="agent-settings-section">
            <div className="agent-settings-section-title">
              <span className="agent-settings-toggle-label">
                Auto Apply Patches
              </span>
              <p className="agent-settings-description v3">
                Automatically apply suggested code patches from the agent
              </p>
            </div>
            <IosSlider
              checked={crossProjectRetrieval}
              onChange={handleCrossProjectToggle}
            />
          </div>
          <div className="agent-settings-section">
            <div className="agent-settings-section-title">
              <span className="agent-settings-toggle-label">
                Auto Apply Patches
              </span>
              <p className="agent-settings-description v3">
                Automatically apply suggested code patches from the agent
              </p>
            </div>
            <IosSlider
              checked={crossProjectRetrieval}
              onChange={handleCrossProjectToggle}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RAGSection;
