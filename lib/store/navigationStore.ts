import { create } from 'zustand';

export type TabType = 'home' | 'calendar' | 'chat' | 'settings';

interface NavigationStore {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
