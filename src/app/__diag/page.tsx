import { headers } from "next/headers";

export const dynamic = "force-dynamic";

function describe(value: string | undefined) {
  if (!value) return { ok: false as const, desc: "missing" };
  let host = "";
  try {
    host = new URL(value).host;
  } catch {
    host = "(not a URL)";
  }
  return {
    ok: true as const,
    desc: `set (${value.length} chars, host: ${host})`,
  };
}

export default async function DiagPage() {
  await headers();

  const vars = [
    ["SUPABASE_URL", describe(process.env.SUPABASE_URL)],
    ["SUPABASE_ANON_KEY", describe(process.env.SUPABASE_ANON_KEY)],
    ["NEXT_PUBLIC_SUPABASE_URL", describe(process.env.NEXT_PUBLIC_SUPABASE_URL)],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", describe(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)],
  ] as const;

  return (
    <div style={{ padding: 24, fontFamily: "ui-monospace, monospace", fontSize: 14, lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
        Env diagnostics
      </h1>
      <p style={{ color: "#888", marginBottom: 12 }}>
        Server-side process.env at request time. Values themselves are not shown — only their presence / shape.
      </p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {vars.map(([name, info]) => (
          <li key={name} style={{ marginBottom: 6 }}>
            <span style={{ color: info.ok ? "#3FB37F" : "#E5634D" }}>
              {info.ok ? "✓" : "✗"}
            </span>{" "}
            <code>{name}</code>: {info.desc}
          </li>
        ))}
      </ul>
      <p style={{ color: "#888", marginTop: 24 }}>
        Build time: {new Date().toISOString()}
      </p>
    </div>
  );
}
