import { Link } from "react-router-dom";
import { useAppTheme } from "@/lib/theme";

export default function BrandWordmark({ to = "/", className = "", showMode = false, asText = false }) {
  const { themeDefinition } = useAppTheme();
  const content = (
    <span className={`brand-wordmark ${className}`.trim()}>
      {themeDefinition.wordmark}
      {showMode && (
        <span className="ml-2 align-middle text-[0.34em] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
          {themeDefinition.modeLabel}
        </span>
      )}
    </span>
  );

  if (asText) {
    return content;
  }

  return (
    <Link to={to} className="inline-flex items-center">
      {content}
    </Link>
  );
}
