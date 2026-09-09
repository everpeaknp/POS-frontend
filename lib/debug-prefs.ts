/**
 * Debug script to check actual stored preferences
 * Run this in browser console: 
 * import { checkStoredPrefs } from '@/lib/debug-prefs'; checkStoredPrefs();
 */

export function checkStoredPrefs() {
  console.log('=== CHECKING STORED PREFERENCES ===');
  
  // Check localStorage
  const stored = localStorage.getItem('khata-appearance');
  console.log('localStorage["khata-appearance"]:', stored);
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      console.log('Parsed preferences:', parsed);
      console.log('navbar_position value:', parsed.navbar_position);
    } catch (e) {
      console.error('Failed to parse:', e);
    }
  } else {
    console.log('No stored preferences found in localStorage');
  }
  
  // Check what defaults are
  const { defaultAppearancePreferences } = await import('@/lib/theme');
  console.log('Code default navbar_position:', defaultAppearancePreferences.navbar_position);
}
