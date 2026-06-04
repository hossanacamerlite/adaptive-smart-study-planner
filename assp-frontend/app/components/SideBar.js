'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import User from "../class/User";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(true);

  const handleNavigation = () => {
    router.push('/view/dashboard');
  };

  const navItems = [
    { href: "/view/dashboard", label: "Dashboard", icon: "🏠" },
    { href: "/view/study-sessions", label: "Study Sessions", icon: "📚" },
    { href: "/view/subjects", label: "Subjects", icon: "📖" },
    { href: "/view/history", label: "History", icon: "🕘" },
    { href: "/view/quiz", label: "Quiz", icon: "📝" },
  ];

  const isActive = (href) =>
    pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <aside
      className={`
        sticky top-0 flex h-screen flex-col
        border-r border-gray-200/70
        bg-white/80 backdrop-blur shadow-sm
        transition-all duration-300
        ${open ? "w-[260px] px-4 py-5" : "w-[90px] px-3 py-5"}
      `}
    >
      {/* Top Section */}
      <div>
        <div className="flex items-start justify-between">
          {open && (
            <div
              className="rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 p-[1px] w-full"
            >
              <div
                className="rounded-2xl bg-white/90 px-4 py-3 cursor-pointer"
                onClick={handleNavigation}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-900">
                  Adaptive Smart
                </p>

                <h2 className="mt-0.5 text-base font-semibold tracking-tight text-gray-900">
                  Study Planner
                </h2>

                <p className="text-sm font-medium text-gray-700">
                  Dashboard
                </p>
              </div>
            </div>
          )}

          {/* Toggle Button */}
          <button
            onClick={() => setOpen(!open)}
            className="ml-2 rounded-lg p-2 hover:bg-gray-100 transition"
          >
            ☰
          </button>
        </div>

        {/* Menu */}
        <nav className="mt-5">
          {open && (
            <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Menu
            </p>
          )}

          <ul className="mt-2 space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      "group flex items-center rounded-xl px-3 py-3 text-sm font-medium transition",
                      open ? "justify-between" : "justify-center",
                      active
                        ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200/70"
                        : "text-gray-700 hover:bg-gray-100/70 hover:text-gray-900"
                    ].join(" ")}
                    aria-current={active ? "page" : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {item.icon}
                      </span>

                      {open && <span>{item.label}</span>}
                    </div>

                    {open && (
                      <span
                        className={[
                          "h-2 w-2 rounded-full transition",
                          active
                            ? "bg-violet-500"
                            : "bg-transparent group-hover:bg-gray-300"
                        ].join(" ")}
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Bottom */}
      <div className="mt-auto border-t border-gray-200/70 pt-4">
        <button
          onClick={() => User.logout()}
          className={[
            "w-full rounded-xl py-2 text-sm font-medium text-red-600 transition hover:bg-red-50",
            open ? "px-3 text-left" : "flex justify-center"
          ].join(" ")}
        >
          {open ? "Logout" : "⎋"}
        </button>

        {open && (
          <p className="mt-3 px-3 text-xs text-gray-400">
            © {new Date().getFullYear()} ASSP
          </p>
        )}
      </div>
    </aside>
  );
}