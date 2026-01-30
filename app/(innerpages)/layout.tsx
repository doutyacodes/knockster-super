"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Network,
  Users,
  ShieldCheck,
  ClipboardList,
  Settings as SettingsIcon,
  UserCircle,
  Menu,
  ChevronRight,
  LogOut,
  Bell,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

export default function InnerPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { name: "Organizations", path: "/organizations", icon: Network },
    { name: "Admin Management", path: "/admins", icon: Users },
    { name: "Notifications", path: "/notifications", icon: Bell },
    { name: "App Settings", path: "/app-settings", icon: SettingsIcon },
    // { name: 'Plans & Security', path: '/plans', icon: ShieldCheck },
    // { name: 'Audit Logs', path: '/logs', icon: ClipboardList },
  ];

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const activePage = navItems.find((item) => item.path === pathname) || {
    name: "Dashboard",
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
          fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${isMobileMenuOpen ? "translate-x-0 w-72" : "-translate-x-full w-72 lg:translate-x-0"}
          ${!isSidebarOpen && !isMobileMenuOpen ? "lg:w-20" : "lg:w-72"}
        `}
        >
          <div className="flex flex-col h-full">
            {/* Logo Section */}
            <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
              <div className="bg-blue-600 rounded-lg p-1.5 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              {(isSidebarOpen || isMobileMenuOpen) && (
                <span className="ml-3 font-bold text-xl tracking-tight text-slate-800">
                  Knock<span className="text-blue-600">ster</span>
                </span>
              )}
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`
                    flex items-center px-3 py-2.5 rounded-xl transition-all group
                    ${
                      pathname === item.path
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }
                  `}
                >
                  <item.icon
                    className={`shrink-0 w-5 h-5 ${pathname === item.path ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`}
                  />
                  {(isSidebarOpen || isMobileMenuOpen) && (
                    <span className="ml-3 font-medium text-sm whitespace-nowrap">
                      {item.name}
                    </span>
                  )}
                  {pathname === item.path &&
                    (isSidebarOpen || isMobileMenuOpen) && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                    )}
                </Link>
              ))}
            </nav>

            {/* User Section Bottom */}
            <div className="p-4 border-t border-slate-100">
              <div className="flex items-center p-2 rounded-xl bg-slate-50">
                <UserCircle className="w-6 h-6 shrink-0 text-blue-600" />
                {(isSidebarOpen || isMobileMenuOpen) && (
                  <div className="ml-3 overflow-hidden">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      Super Admin
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {user?.email || "admin@knockster.io"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden lg:flex absolute -right-3 top-20 bg-white border border-slate-200 rounded-full p-1 shadow-sm text-slate-400 hover:text-slate-600 hover:border-slate-300"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform duration-300 ${isSidebarOpen ? "rotate-180" : ""}`}
            />
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Topbar */}
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="hidden lg:flex items-center text-sm text-slate-500 font-medium">
                <span className="text-slate-400">Knockster</span>
                <ChevronRight className="w-4 h-4 mx-2 text-slate-300" />
                <span className="text-slate-800">
                  {(activePage as any).name}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">
                  Logout
                </span>
              </button>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
