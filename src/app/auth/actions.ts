"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
};

export async function signIn(_prev: AuthState | undefined, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Введи email и пароль" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: translateError(error.message) };
  }

  redirect("/");
}

export async function signUp(_prev: AuthState | undefined, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  const householdName = String(formData.get("household_name") ?? "").trim() || "Семья";

  if (!email || !password || !displayName) {
    return { error: "Заполни имя, email и пароль" };
  }
  if (password.length < 6) {
    return { error: "Пароль должен быть от 6 символов" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        household_name: householdName,
      },
    },
  });

  if (error) {
    return { error: translateError(error.message) };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function translateError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("invalid login credentials")) return "Неверный email или пароль";
  if (lower.includes("email not confirmed")) return "Email не подтверждён — проверь почту";
  if (lower.includes("user already registered")) return "Такой email уже зарегистрирован";
  if (lower.includes("password")) return "Пароль слишком слабый (минимум 6 символов)";
  return msg;
}
