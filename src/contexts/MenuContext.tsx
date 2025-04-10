import React, { createContext, useContext, useState, ReactNode } from 'react';

const MENU_STATE_KEY = 'menu-expanded';

interface MenuContextType {
  isExpanded: boolean;
  toggleMenu: () => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem(MENU_STATE_KEY);
    return saved ? JSON.parse(saved) : true;
  });

  const toggleMenu = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem(MENU_STATE_KEY, JSON.stringify(newState));
  };

  return (
    <MenuContext.Provider value={{ isExpanded, toggleMenu }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
}