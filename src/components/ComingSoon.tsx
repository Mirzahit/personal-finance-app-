"use client";

import { motion } from "framer-motion";
import {
  CreditCard,
  HandCoins,
  LineChart,
  Settings as SettingsIcon,
  Target,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

const iconMap: Record<string, LucideIcon> = {
  wallet: Wallet,
  "credit-card": CreditCard,
  target: Target,
  "hand-coins": HandCoins,
  users: Users,
  "line-chart": LineChart,
  settings: SettingsIcon,
};

export type ComingSoonIcon = keyof typeof iconMap;

export function ComingSoon({
  icon,
  title,
  description,
  hint,
}: {
  icon: ComingSoonIcon;
  title: string;
  description: string;
  hint?: string;
}) {
  const Icon = iconMap[icon] ?? Wallet;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-[22px] border border-border-default bg-bg-elevated px-6 py-12 text-center lg:px-10 lg:py-20"
    >
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft">
        <Icon className="h-6 w-6 text-text-primary" strokeWidth={1.5} />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-text-secondary">{description}</p>
      {hint ? <p className="mx-auto mt-2 max-w-md text-xs text-text-muted">{hint}</p> : null}
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-border-default bg-bg-base px-5 py-2.5 text-sm text-text-secondary transition-colors hover:bg-bg-card"
      >
        На главную
      </Link>
    </motion.div>
  );
}
