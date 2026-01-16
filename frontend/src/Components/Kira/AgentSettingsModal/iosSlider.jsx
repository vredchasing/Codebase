import React from "react";
import "./iosSlider.css";

export default function IosSlider({ checked, onChange, label }) {
  return (
    <label className="ios-toggle-switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />
      <span className="slider"></span>
      {label && <span className="toggle-label">{label}</span>}
    </label>
  );
}
