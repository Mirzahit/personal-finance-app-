"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Lightbulb, Sparkles, ThumbsUp } from "lucide-react";
import { useState, useTransition } from "react";
import {
  diagAiAction,
  getRecommendationsAction,
  type RecommendationsResult,
} from "@/app/actions";
import type { Recommendation } from "@/lib/claude";

const ICONS = {
  tip: Lightbulb,
  warning: AlertTriangle,
  praise: ThumbsUp,
};

const COLORS = {
  tip: { c: "var(--accent)", bg: "rgba(40,98,58,0.18)" },
  warning: { c: "var(--warning)", bg: "rgba(232,177,68,0.16)" },
  praise: { c: "var(--income)", bg: "rgba(63,179,127,0.14)" },
};

export function AiRecommendations() {
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<Recommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    setError(null);
    startTransition(async () => {
      const result: RecommendationsResult = await getRecommendationsAction();
      if (result.ok) {
        setItems(result.recommendations);
      } else {
        setError(result.error);
        setItems(null);
      }
    });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-[22px] border border-border-default p-5 lg:p-6"
      style={{
        background:
          "radial-gradient(140% 120% at 100% 0%, rgba(91,163,208,0.10) 0%, var(--bg-elevated) 60%)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="grid h-10 w-10 place-items-center rounded-2xl"
            style={{ background: "rgba(91,163,208,0.18)" }}
          >
            <Sparkles
              className="h-5 w-5"
              strokeWidth={1.75}
              style={{ color: "var(--leila-request)" }}
            />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">AI-советы</p>
            <p className="text-xs text-text-muted">
              Персональные подсказки на основе твоих данных
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              startTransition(async () => {
                const r = await diagAiAction();
                setError(r.message);
                setItems(null);
              });
            }}
            className="rounded-full border border-border-default px-3 py-2 text-xs text-text-secondary hover:bg-bg-card"
          >
            Диагностика
          </button>
          <button
            type="button"
            onClick={onClick}
            disabled={isPending}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending
              ? "Думаю…"
              : items
                ? "Обновить"
                : "Получить советы"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error ? (
          <motion.p
            key="err"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-sm text-expense"
          >
            {error}
          </motion.p>
        ) : null}
        {items && items.length > 0 ? (
          <motion.div
            key="items"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex flex-col gap-2.5"
          >
            {items.map((item, i) => {
              const Icon = ICONS[item.type] ?? Lightbulb;
              const color = COLORS[item.type] ?? COLORS.tip;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" }}
                  className="flex items-start gap-3 rounded-[14px] border border-border-subtle bg-bg-base/40 px-4 py-3"
                >
                  <div
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
                    style={{ background: color.bg }}
                  >
                    <Icon
                      className="h-4 w-4"
                      strokeWidth={1.75}
                      style={{ color: color.c }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">{item.body}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}
