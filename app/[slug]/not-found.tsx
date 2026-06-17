import Link from 'next/link';
import { AlertCircle, Home } from 'lucide-react';

export default function TenantNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-100 rounded-full">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Workspace Not Found
        </h1>
        
        <p className="text-gray-600 mb-6">
          The workspace you're looking for doesn't exist or you don't have access to it.
        </p>
        
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
          
          <Link
            href="/auth/login"
            className="block w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Back to Login
          </Link>
        </div>
        
        <p className="text-xs text-gray-500 mt-6">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  );
}
