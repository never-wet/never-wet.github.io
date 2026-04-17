import type { ReactNode } from "react";

const toneClassMap = {
  neutral: "badge",
  success: "badge badge--success",
  warning: "badge badge--warning",
  accent: "badge badge--accent",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: keyof typeof toneClassMap;
}) {
  return <span className={toneClassMap[tone]}>{children}</span>;
}
