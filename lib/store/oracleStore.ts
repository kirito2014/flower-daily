// lib/store/oracleStore.ts
import { create } from 'zustand';

export interface Letter {
  id: string;
  flowerName: string;
  content: string;
  date: string;
  read: boolean;
}

interface OracleStore {
  letters: Letter[];
  unreadCount: number;
  isOpen: boolean; // Modal 是否打开
  addLetter: (flowerName: string, content: string) => void;
  openMailbox: () => void;
  closeMailbox: () => void;
  markAllAsRead: () => void;
}

export const useOracleStore = create<OracleStore>((set) => ({
  letters: [],
  unreadCount: 0,
  isOpen: false,

  addLetter: (flowerName, content) => set((state) => ({
    letters: [
      {
        id: Math.random().toString(36).substring(7),
        flowerName,
        content,
        date: new Date().toLocaleDateString(),
        read: false
      },
      ...state.letters // 新信件排在最前
    ],
    unreadCount: state.unreadCount + 1,
  })),

  openMailbox: () => set({ isOpen: true }),
  
  closeMailbox: () => set((state) => ({ 
    isOpen: false,
    unreadCount: 0 // 关闭时清空未读数（或者你希望打开时就清空也可以）
  })),

  markAllAsRead: () => set((state) => ({
    unreadCount: 0,
    letters: state.letters.map(l => ({ ...l, read: true }))
  }))
}));