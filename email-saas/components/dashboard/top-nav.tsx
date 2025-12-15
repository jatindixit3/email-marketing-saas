"use client";

import React, { useEffect, useState } from "react";
import { Menu, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

interface TopNavProps {
  onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const [notificationCount, setNotificationCount] = React.useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUserEmail(user.email || null);
        // Try to get user metadata or name
        const displayName = user.user_metadata?.full_name ||
                           user.user_metadata?.name ||
                           user.email?.split('@')[0] ||
                           'User';
        setUserName(displayName);
      }
    };

    getUser();
  }, []);

  // Get initials from name or email
  const getInitials = () => {
    if (userName && userName !== 'User') {
      return userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (userEmail) {
      return userEmail[0].toUpperCase();
    }
    return 'U';
  };

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
                {userName || 'Loading...'}
              </div>
              <div className="text-xs text-gray-400">
                {userEmail || 'Loading...'}
              </div>
            </div>
            <button className="relative h-10 w-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-semibold hover:bg-teal-700 transition-colors">
              {getInitials()}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
