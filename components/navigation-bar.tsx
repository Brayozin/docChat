"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { MessageCircle, FileText, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const routes = [
  { path: "/chats", icon: MessageCircle, label: "Chats" },
  { path: "/documents", icon: FileText, label: "Documents" },
  { path: "/profile", icon: User, label: "Profile" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const leftRoutes = routes.slice(0, 2);
const rightRoutes = routes.slice(2);

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
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50">
      <div className="relative" ref={navRef}>
        {/* Sliding indicator */}
        <div
          className="absolute rounded-full bg-rose-200 shadow-2xl transition-all duration-300 ease-in-out pointer-events-none z-0"
          style={indicatorStyle}
        />

        {/* Navigation links container */}
        <div className="relative bg-rose-50/40 shadow-md backdrop-blur-[1px] border-rose-300  border-2 p-0.5 rounded-full flex items-center gap-2 z-10">
          {/* Left routes */}
          {leftRoutes.map((route) => {
            const Icon = route.icon;
            const isActive = pathname === route.path;

            return (
              <Link
                key={route.path}
                href={route.path}
                className={cn(
                  "rounded-full p-2 transition-colors duration-300 ease-in-out relative z-10",
                  isActive ? "text-rose-600" : "text-rose-400"
                )}
                aria-label={route.label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}

          {/* Logo in the center */}
          <Link
            href="/"
            className="relative z-10 mx-1 transition-transform duration-300 hover:scale-110 active:scale-95"
            aria-label="Home"
          >
            <div className="w-9 h-9 flex items-center justify-center">
              <Image
                src="/docChatLogo.svg"
                alt="DocChat Logo"
                width={36}
                height={36}
                className="drop-shadow-md"
                priority
              />
            </div>
          </Link>

          {/* Right routes */}
          {rightRoutes.map((route) => {
            const Icon = route.icon;
            const isActive = pathname === route.path;

            return (
              <Link
                key={route.path}
                href={route.path}
                className={cn(
                  "rounded-full p-2 transition-colors duration-300 ease-in-out relative z-10",
                  isActive ? "text-rose-600" : "text-rose-400"
                )}
                aria-label={route.label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
