"use client";

import React from "react";
import { Menu, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TopNavProps {
  onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const [notificationCount, setNotificationCount] = React.useState(0);

  return (
    <header className="sticky top-0 z-30 h-16 bg-gray-900 border-b border-gray-800">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left section */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-gray-400 hover:text-gray-200 mr-4"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div>
            <h1 className="text-xl font-semibold text-white">
              Dashboard
            </h1>
            <p className="text-sm text-gray-400 hidden sm:block">
              Welcome back! Here's your email marketing overview
            </p>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Plan Badge */}
          <Badge className="bg-teal-900/30 text-teal-400 border-teal-800 hidden sm:flex">
            Free Plan
          </Badge>

          {/* Notifications */}
          <button className="relative text-gray-400 hover:text-gray-200">
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>

          {/* User avatar */}
          <div className="flex items-center gap-3 pl-3 border-l border-gray-800">
            <div className="hidden md:block text-right">
              <div className="text-sm font-medium text-white">
                Account
              </div>
              <div className="text-xs text-gray-400">
                user@example.com
              </div>
            </div>
            <button className="relative h-10 w-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-semibold hover:bg-teal-700 transition-colors">
              U
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
