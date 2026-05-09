"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CreditCard,
  HandCoins,
  History,
  LayoutDashboard,
  LineChart,
  LogOut,
  Plus,
  Search,
  Settings,
  Target,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { signOut } from "@/app/auth/actions";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

const ownerNav: NavItem[] = [
  { href: "/", label: "Главная", icon: LayoutDashboard },
  { href: "/accounts", label: "Счета", icon: Wallet },
  { href: "/envelopes", label: "Конверты", icon: CreditCard },
  { href: "/goals", label: "Цели", icon: Target },
  { href: "/debts", label: "Долги", icon: HandCoins },
  { href: "/leila", label: "Лейла", icon: Users },
  { href: "/analytics", label: "Аналитика", icon: LineChart },
  { href: "/settings", label: "Настройки", icon: Settings },
];

const ownerBottom: NavItem[] = [
  { href: "/", label: "Главная", icon: LayoutDashboard },
  { href: "/envelopes", label: "Конверты", icon: CreditCard },
  { href: "/leila", label: "Лейла", icon: Users },
  { href: "/settings", label: "Ещё", icon: Settings },
];

const spouseNav: NavItem[] = [
  { href: "/", label: "Главная", icon: LayoutDashboard },
  { href: "/me", label: "Мои запросы", icon: History },
];

const spouseBottom: NavItem[] = [
  { href: "/", label: "Главная", icon: LayoutDashboard },
  { href: "/me", label: "Запросы", icon: History },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type ShellProps = {
  children: ReactNode;
  role: "owner" | "spouse";
  displayName: string;
  avatarLetter: string;
};

export function AppShell({ children, role, displayName, avatarLetter }: ShellProps) {
  const pathname = usePathname();
  const hideShell =
    pathname.startsWith("/expense/new") ||
    pathname.startsWith("/accounts/new") ||
    pathname.startsWith("/envelopes/new") ||
    pathname.startsWith("/goals/new") ||
    pathname.startsWith("/debts/new") ||
    pathname.startsWith("/request/new") ||
    pathname.startsWith("/transactions/") ||
    pathname.match(/^\/goals\/[^/]+\/edit/) !== null ||
    pathname.match(/^\/debts\/[^/]+\/edit/) !== null ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup");

  if (hideShell) return <>{children}</>;

  const navItems = role === "spouse" ? spouseNav : ownerNav;
  const bottomItems = role === "spouse" ? spouseBottom : ownerBottom;
  const fabHref = role === "spouse" ? "/request/new" : "/expense/new";
  const fabLabel = role === "spouse" ? "Запросить трату" : "Добавить расход";

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar
        pathname={pathname}
        navItems={navItems}
        displayName={displayName}
        avatarLetter={avatarLetter}
        role={role}
      />
      <div className="flex flex-1 flex-col">
        <TopBar
          displayName={displayName}
          avatarLetter={avatarLetter}
          fabHref={fabHref}
          fabLabel={fabLabel}
          role={role}
        />
        <main className="flex-1 px-5 pt-6 pb-32 lg:px-10 lg:pt-8 lg:pb-12">
          <div className="mx-auto w-full max-w-[1200px]">{children}</div>
        </main>
      </div>
      <FloatingAdd href={fabHref} label={fabLabel} />
      <BottomBar pathname={pathname} bottomItems={bottomItems} />
    </div>
  );
}

function Sidebar({
  pathname,
  navItems,
  displayName,
  avatarLetter,
  role,
}: {
  pathname: string;
  navItems: NavItem[];
  displayName: string;
  avatarLetter: string;
  role: "owner" | "spouse";
}) {
  return (
    <aside className="hidden lg:flex lg:w-[240px] lg:shrink-0 lg:flex-col lg:border-r lg:border-border-subtle lg:bg-bg-elevated/40 lg:px-4 lg:py-6">
      <Link href="/" className="flex items-center gap-2.5 px-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-white">
          <Wallet className="h-5 w-5" strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">Финансы</p>
          <p className="text-[11px] text-text-muted leading-tight">семейный учёт</p>
        </div>
      </Link>

      <nav className="mt-8 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-accent-soft text-text-primary"
                  : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${
                  active ? "text-text-primary" : "text-text-muted group-hover:text-text-secondary"
                }`}
                strokeWidth={1.75}
              />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-border-default bg-bg-elevated p-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-sm font-semibold">
            {avatarLetter}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium leading-tight">{displayName}</p>
            <p className="text-[11px] text-text-muted leading-tight">
              {role === "owner" ? "глава семьи" : "со-пользователь"}
            </p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Выйти"
              className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-bg-card hover:text-text-secondary"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

function TopBar({
  displayName,
  avatarLetter,
  fabHref,
  fabLabel,
  role,
}: {
  displayName: string;
  avatarLetter: string;
  fabHref: string;
  fabLabel: string;
  role: "owner" | "spouse";
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-border-subtle bg-bg-base/80 px-5 py-3 backdrop-blur-md lg:px-10 lg:py-4">
      <div className="mx-auto flex w-full max-w-[1200px] items-center gap-4">
        <div className="flex items-center gap-3 lg:hidden">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-base font-semibold">
            {avatarLetter}
          </div>
          <div>
            <p className="text-xs text-text-secondary leading-tight">Привет,</p>
            <p className="text-base font-semibold leading-tight">{displayName}</p>
          </div>
        </div>

        {role === "owner" ? (
          <div className="hidden flex-1 lg:flex">
            <div className="flex w-full max-w-md items-center gap-2.5 rounded-full border border-border-default bg-bg-elevated px-4 py-2.5">
              <Search className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
              <input
                type="text"
                placeholder="Найти операцию, конверт, цель…"
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
              />
              <kbd className="hidden rounded-md border border-border-subtle bg-bg-base/60 px-1.5 py-0.5 text-[10px] text-text-muted lg:inline-block">
                ⌘K
              </kbd>
            </div>
          </div>
        ) : (
          <div className="hidden flex-1 lg:block" />
        )}

        <div className="ml-auto flex items-center gap-2">
          <Link
            href={fabHref}
            className="hidden items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover lg:flex"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} />
            {fabLabel}
          </Link>
          {role === "owner" ? (
            <Link
              href="/leila"
              aria-label="Уведомления"
              className="relative grid h-10 w-10 place-items-center rounded-full border border-border-default bg-bg-elevated transition-colors hover:bg-bg-card"
            >
              <Bell className="h-4 w-4 text-text-secondary" strokeWidth={1.75} />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-leila-request" />
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function FloatingAdd({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="fixed bottom-[max(env(safe-area-inset-bottom),84px)] left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-base font-medium text-white shadow-[0_10px_30px_-8px_rgba(40,98,58,0.6)] transition-colors active:bg-accent-hover lg:hidden"
    >
      <Plus className="h-5 w-5" strokeWidth={2.25} />
      {label}
    </Link>
  );
}

function BottomBar({
  pathname,
  bottomItems,
}: {
  pathname: string;
  bottomItems: NavItem[];
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-border-subtle bg-bg-base/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] transition-colors ${
                active ? "text-text-primary" : "text-text-muted"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${active ? "text-accent" : ""}`}
                strokeWidth={active ? 2 : 1.75}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
