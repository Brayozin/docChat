"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { MessageCircle, FileText, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
  { path: "/chats", icon: MessageCircle, label: "Chats" },
  { path: "/documents", icon: FileText, label: "Documents" },
  { path: "/profile", icon: User, label: "Profile" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export function NavigationBar() {
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });
  const navRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  const updateIndicator = useCallback(() => {
    if (!navRef.current) return;

    const activeLink = navRef.current.querySelector<HTMLElement>(
      `a[href="${pathname}"]`
    );
    if (!activeLink) return;

    const activeRect = activeLink.getBoundingClientRect();
    const navRect = navRef.current.getBoundingClientRect();

    requestAnimationFrame(() => {
      setIndicatorStyle({
        left: activeRect.left - navRect.left,
        top: activeRect.top - navRect.top,
        width: activeRect.width,
        height: activeRect.height,
      });
    });
  }, [pathname]);

  useEffect(() => {
    const timeoutId = setTimeout(updateIndicator, 0);

    window.addEventListener("resize", updateIndicator);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [updateIndicator, pathname]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="relative" ref={navRef}>
        {/* Sliding indicator */}
        <div
          className="absolute rounded-full bg-rose-200 shadow-2xl transition-all duration-300 ease-in-out pointer-events-none z-0"
          style={indicatorStyle}
        />

        {/* Navigation links container */}
        <div className="relative bg-rose-50/40 shadow-md backdrop-blur-[1px] border-rose-300  border-2 p-1 rounded-full flex items-center justify-between gap-3 z-10">
          {routes.map((route) => {
            const Icon = route.icon;
            const isActive = pathname === route.path;

            return (
              <Link
                key={route.path}
                href={route.path}
                className={cn(
                  "rounded-full p-3 transition-colors duration-300 ease-in-out relative z-10",
                  isActive ? "text-rose-600" : "text-rose-400"
                )}
                aria-label={route.label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
