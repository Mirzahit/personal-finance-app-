"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  initialLeilaRequest,
  initialTxs,
  type AccountId,
  type Currency,
  type EnvelopeId,
  type LeilaRequest,
  type Tx,
} from "./data";

type AddExpenseInput = {
  title: string;
  amount: number;
  currency: Currency;
  accountId: AccountId;
  envelopeId?: EnvelopeId;
  fromLeila?: boolean;
};

type StoreValue = {
  txs: Tx[];
  leilaRequest: LeilaRequest;
  addExpense: (input: AddExpenseInput) => void;
  approveLeila: () => void;
  snoozeLeila: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [txs, setTxs] = useState<Tx[]>(initialTxs);
  const [leilaRequest, setLeilaRequest] = useState<LeilaRequest>(initialLeilaRequest);

  const addExpense = useCallback((input: AddExpenseInput) => {
    setTxs((prev) => [
      {
        id: `t-${Date.now()}`,
        title: input.title,
        accountId: input.accountId,
        amount: input.amount,
        currency: input.currency,
        type: "expense",
        time: nowHHMM(),
        iconName: "shopping-bag",
        envelopeId: input.envelopeId,
        fromLeila: input.fromLeila,
      },
      ...prev,
    ]);
  }, []);

  const approveLeila = useCallback(() => {
    setLeilaRequest((r) => ({ ...r, status: "approved" }));
    setTxs((prev) => [
      {
        id: `t-leila-${Date.now()}`,
        title: `Лейла: ${initialLeilaRequest.category}`,
        accountId: initialLeilaRequest.accountId,
        amount: initialLeilaRequest.amount,
        currency: initialLeilaRequest.currency,
        type: "expense",
        time: nowHHMM(),
        iconName: "shopping-bag",
        fromLeila: true,
      },
      ...prev,
    ]);
  }, []);

  const snoozeLeila = useCallback(() => {
    setLeilaRequest((r) => ({ ...r, status: "snoozed" }));
  }, []);

  const value = useMemo<StoreValue>(
    () => ({ txs, leilaRequest, addExpense, approveLeila, snoozeLeila }),
    [txs, leilaRequest, addExpense, approveLeila, snoozeLeila]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
