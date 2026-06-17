"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { usePermissions } from '@/lib/hooks/usePermissions';

export default function DebugPOSPage() {
  const { user } = useAuth();
  const permissions = usePermissions();
  const [localStorageUser, setLocalStorageUser] = useState<any>(null);

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setLocalStorageUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">POS Module Debug Page</h1>

      <div className="space-y-6">
        {/* Auth Context User */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">1. Auth Context User</h2>
          {user ? (
            <div className="space-y-2">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p><strong>Tenant:</strong> {user.tenant?.name || 'None'}</p>
              <p><strong>Active Modules:</strong></p>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(user.tenant?.active_modules, null, 2)}
              </pre>
              <p><strong>Has POS in modules:</strong> {user.tenant?.active_modules?.includes('pos') ? '✅ YES' : '❌ NO'}</p>
            </div>
          ) : (
            <p className="text-red-600">No user in Auth Context</p>
          )}
        </div>

        {/* LocalStorage User */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">2. LocalStorage User</h2>
          {localStorageUser ? (
            <div className="space-y-2">
              <p><strong>Email:</strong> {localStorageUser.email}</p>
              <p><strong>Role:</strong> {localStorageUser.role}</p>
              <p><strong>Tenant:</strong> {localStorageUser.tenant?.name || 'None'}</p>
              <p><strong>Active Modules:</strong></p>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(localStorageUser.tenant?.active_modules, null, 2)}
              </pre>
              <p><strong>Has POS in modules:</strong> {localStorageUser.tenant?.active_modules?.includes('pos') ? '✅ YES' : '❌ NO'}</p>
            </div>
          ) : (
            <p className="text-red-600">No user in localStorage</p>
          )}
        </div>

        {/* Permissions Hook */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">3. Permissions Hook</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {permissions.loading ? 'Yes' : 'No'}</p>
            <p><strong>hasModuleAccess('pos'):</strong> {permissions.hasModuleAccess('pos') ? '✅ YES' : '❌ NO'}</p>
            <p><strong>canView('pos'):</strong> {permissions.canView('pos') ? '✅ YES' : '❌ NO'}</p>
            <p><strong>canCreate('pos'):</strong> {permissions.canCreate('pos') ? '✅ YES' : '❌ NO'}</p>
          </div>
        </div>

        {/* Sidebar Filter Logic */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">4. Sidebar Filter Logic</h2>
          <div className="space-y-2">
            <p className="font-semibold">For POS to show, these must be true:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>requiredModule check:</strong> {permissions.canView('pos') ? '✅ PASS' : '❌ FAIL'}
                <span className="text-sm text-gray-600 ml-2">(calls permissions.canView('pos'))</span>
              </li>
              <li>
                <strong>User role:</strong> {user?.role === 'admin' || user?.role === 'manager' ? '✅ PASS' : '❌ FAIL'}
                <span className="text-sm text-gray-600 ml-2">(admin or manager)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">5. Diagnosis</h2>
          {user && user.tenant && user.tenant.active_modules?.includes('pos') && permissions.canView('pos') ? (
            <div className="bg-green-50 border border-green-200 p-4 rounded">
              <p className="text-green-800 font-semibold">✅ All checks pass - POS should be visible!</p>
              <p className="text-sm text-green-700 mt-2">If you still don't see POS in the sidebar, try:</p>
              <ol className="list-decimal list-inside text-sm text-green-700 mt-2 space-y-1">
                <li>Hard refresh the page (Ctrl+Shift+R)</li>
                <li>Check browser console for errors</li>
                <li>Verify sidebar component is rendering correctly</li>
              </ol>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 p-4 rounded">
              <p className="text-red-800 font-semibold">❌ Issues found:</p>
              <ul className="list-disc list-inside text-sm text-red-700 mt-2 space-y-1">
                {!user && <li>No user logged in</li>}
                {user && !user.tenant && <li>User has no tenant</li>}
                {user && user.tenant && !user.tenant.active_modules?.includes('pos') && (
                  <li>POS not in tenant's active_modules</li>
                )}
                {user && user.tenant && !permissions.canView('pos') && (
                  <li>User doesn't have permission to view POS</li>
                )}
              </ul>
              <div className="mt-4">
                <p className="text-sm font-semibold text-red-800">Solution:</p>
                <button
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = '/auth/login';
                  }}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Clear Cache & Re-login
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">6. Quick Actions</h2>
          <div className="space-y-2">
            <button
              onClick={() => {
                console.log('=== POS DEBUG INFO ===');
                console.log('User:', user);
                console.log('LocalStorage User:', localStorageUser);
                console.log('Permissions:', permissions);
                console.log('Has POS in active_modules:', user?.tenant?.active_modules?.includes('pos'));
                console.log('canView(pos):', permissions.canView('pos'));
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
            >
              Log Debug Info to Console
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                alert('Cache cleared! Click OK to reload.');
                window.location.reload();
              }}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 mr-2"
            >
              Clear Cache & Reload
            </button>
            <button
              onClick={() => {
                window.location.href = '/dashboard';
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
