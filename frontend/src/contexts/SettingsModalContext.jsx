import React, { createContext, useContext, useState } from 'react';

const SettingsModalContext = createContext();

export const useSettingsModal = () => {
  const context = useContext(SettingsModalContext);
  if (!context) {
    throw new Error('useSettingsModal must be used within SettingsModalProvider');
  }
  return context;
};

export const SettingsModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openSettings = () => setIsOpen(true);
  const closeSettings = () => setIsOpen(false);

  return (
    <SettingsModalContext.Provider value={{ isOpen, openSettings, closeSettings }}>
      {children}
    </SettingsModalContext.Provider>
  );
};








