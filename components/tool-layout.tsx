"use client"

import { useState } from "react"

export default function ToolLayout({
  title = "PDF Splitter",
  children,
}: {
  title?: string
  children?: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      {/* Left Canvas / Preview */}
      <div className="flex-1 flex items-center justify-center overflow-auto">
        <div className="max-w-4xl w-full h-full flex items-center justify-center bg-white shadow rounded-lg p-6">
          {/* Example preview (dummy content) */}
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
            <p className="text-lg font-medium">{title} Preview</p>
            <div className="mt-4 border-2 border-dashed border-gray-300 rounded-lg w-60 h-80 flex items-center justify-center">
              <span className="text-sm">PDF / Image Page Preview</span>
            </div>
            {children}
          </div>
        </div>
      </div>

      {/* Right Sidebar (Fixed Options) */}
      <div className="w-80 bg-white border-l shadow-lg flex flex-col fixed right-0 top-0 h-screen p-6">
        <h2 className="text-xl font-semibold mb-4">{title} Options</h2>

        {/* Example Options */}
        <div className="space-y-4 flex-1 overflow-auto">
          <div>
            <label className="block text-sm font-medium mb-1">Range Mode</label>
            <div className="flex gap-2">
              <button className="px-3 py-1 border rounded bg-red-500 text-white">
                Custom ranges
              </button>
              <button className="px-3 py-1 border rounded">Fixed ranges</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Page Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                className="w-20 border rounded px-2 py-1"
                placeholder="From"
              />
              <input
                type="number"
                className="w-20 border rounded px-2 py-1"
                placeholder="To"
              />
            </div>
          </div>

          <button className="mt-6 w-full py-3 rounded-lg bg-red-600 text-white font-semibold shadow hover:bg-red-700">
            Split PDF
          </button>
        </div>
      </div>
    </div>
  )
}