import { useState } from 'react'

export function POSSimple() {
  const [message] = useState('POS System is loading...')

  return (
    <div className="h-full p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Point of Sale System - Simple Mode
        </h1>
        
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <p className="text-lg text-gray-600 mb-4">{message}</p>
          <p className="text-sm text-gray-500">
            This is a simplified version to test basic POS access.
            If you can see this message, the routing and basic React components are working.
          </p>
          
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-sm font-medium text-green-800 mb-2">✅ Working Components:</h3>
            <ul className="text-sm text-green-700 text-left">
              <li>• React rendering</li>
              <li>• POS routing (/pos)</li>
              <li>• CSS styling</li>
              <li>• Component mounting</li>
            </ul>
          </div>

          <div className="mt-4">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}