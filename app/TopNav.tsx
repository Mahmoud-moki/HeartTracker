import { Search, Bell, Moon, Sun } from "lucide-react";

export function TopNav() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative"></div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}

        {/* Notifications */}
        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          {/* <Bell className="w-5 h-5" /> */}
          {/* <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span> */}
        </button>

        {/* Generate Report Button */}
        {/* <button className="px-4 py-2 bg-linear-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg transition-all">
          Generate Report
        </button> */}

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">Made by </p>
            <p className="text-xs text-gray-500">ECU Students</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            MM
          </div>
        </div>
      </div>
    </header>
  );
}
