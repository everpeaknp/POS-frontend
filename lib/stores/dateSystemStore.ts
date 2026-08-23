import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { userApi } from '@/lib/api/user';
import {
  DATE_SYSTEM_STORAGE_KEY,
  type DateCalendarSystem,
  formatDisplayDate,
  formatDisplayDateTime,
} from '@/lib/dates';

interface DateSystemState {
  dateSystem: DateCalendarSystem;
  loading: boolean;
  initialized: boolean;
  setDateSystem: (system: DateCalendarSystem, userId?: number) => Promise<void>;
  loadDateSystem: (userId?: number) => Promise<void>;
  formatDate: (value: string | Date | null | undefined, fallback?: string) => string;
  formatDateTime: (value: string | Date | null | undefined, fallback?: string) => string;
}

export const useDateSystemStore = create<DateSystemState>()(
  persist(
    (set, get) => ({
      dateSystem: 'AD',
      loading: false,
      initialized: false,

      loadDateSystem: async (userId?: number) => {
        // Don't reload if already initialized
        if (get().initialized && !userId) {
          return;
        }

        set({ loading: true });
        
        if (!userId) {
          set({ loading: false, initialized: true });
          return;
        }

        try {
          const prefs = await userApi.getAppearancePreferences();
          const system: DateCalendarSystem = prefs.date_calendar_system === 'BS' ? 'BS' : 'AD';
          set({ dateSystem: system, loading: false, initialized: true });
        } catch (error) {
          console.error('Failed to load date system preference:', error);
          set({ loading: false, initialized: true });
        }
      },

      setDateSystem: async (system: DateCalendarSystem, userId?: number) => {
        // Update immediately for instant UI feedback
        set({ dateSystem: system });

        if (userId) {
          try {
            await userApi.updateAppearancePreferences({ date_calendar_system: system });
          } catch (error) {
            console.error('Failed to save date system preference:', error);
            throw error;
          }
        }
      },

      formatDate: (value: string | Date | null | undefined, fallback?: string) => {
        const { dateSystem } = get();
        return formatDisplayDate(value, dateSystem, { fallback });
      },

      formatDateTime: (value: string | Date | null | undefined, fallback?: string) => {
        const { dateSystem } = get();
        return formatDisplayDateTime(value, dateSystem, { fallback });
      },
    }),
    {
      name: DATE_SYSTEM_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ dateSystem: state.dateSystem }),
    }
  )
);
