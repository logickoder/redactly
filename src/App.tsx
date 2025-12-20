import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Redactly</h1>
          <p className="text-gray-600">
            Secure, client-side WhatsApp chat redaction tool
          </p>
        </div>
        
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-indigo-900 mb-3">
            Welcome to Redactly
          </h2>
          <p className="text-indigo-700 mb-4">
            This PWA is built with React, Vite, TypeScript, and Tailwind CSS.
            All processing happens in your browser - your data never leaves your device.
          </p>
          <div className="space-y-2 text-sm text-indigo-600">
            <div className="flex items-center">
              <span className="mr-2">✓</span>
              <span>Client-side processing</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">✓</span>
              <span>Works offline (PWA)</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">✓</span>
              <span>No data uploaded to servers</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button 
            onClick={() => setCount((count) => count + 1)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-200 transform hover:scale-105"
          >
            Test Counter: {count}
          </button>
          <p className="text-sm text-gray-500 mt-4">
            Click to test React state management
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
