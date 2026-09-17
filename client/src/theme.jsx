import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const UI_THEME_KEY = "ui-theme";

export const UI_THEMES = [
  {
    id: "harbor",
    label: "Harbor",
    hint: "Teal night, the original look",
    swatch: "#3ce6d4",
    swatches: ["#171c2a", "#3ce6d4", "#e8c36a", "#6ec8ff"],
    meta: "#171c2a",
  },
  {
    id: "jellyfish",
    label: "JellyFish",
    hint: "Deep ocean neon, VS Code glow",
    swatch: "#00ffff",
    swatches: ["#00002c", "#ff0062", "#eeff00", "#00ffff"],
    meta: "#00002c",
  },
  {
    id: "ember",
    label: "Ember",
    hint: "Warm gold firelight",
    swatch: "#ff7e34",
    swatches: ["#1a1410", "#ff7e34", "#ffd27a", "#ff9a62"],
    meta: "#1a1410",
  },
  {
    id: "ink",
    label: "Ink",
    hint: "Black, white, and quiet lines",
    swatch: "#f2f2f2",
    swatches: ["#0b0b0b", "#f2f2f2", "#8a8a8a", "#3a3a3a"],
    meta: "#0b0b0b",
  },
];

export const accentMap = {
  gold: {
    text: "text-gold",
    bar: "bg-gold",
    ring: "ring-gold/40",
    glow: "shadow-[0_0_24px_color-mix(in_oklab,var(--color-gold)_22%,transparent)]",
    soft: "bg-gold/12",
  },
  teal: {
    text: "text-teal",
    bar: "bg-teal",
    ring: "ring-teal/40",
    glow: "shadow-[0_0_24px_color-mix(in_oklab,var(--color-teal)_20%,transparent)]",
    soft: "bg-teal/12",
  },
  coral: {
    text: "text-coral",
    bar: "bg-coral",
    ring: "ring-coral/40",
    glow: "shadow-[0_0_24px_color-mix(in_oklab,var(--color-coral)_20%,transparent)]",
    soft: "bg-coral/12",
  },
  cyan: {
    text: "text-cyan",
    bar: "bg-cyan",
    ring: "ring-cyan/40",
    glow: "shadow-[0_0_24px_color-mix(in_oklab,var(--color-cyan)_20%,transparent)]",
    soft: "bg-cyan/12",
  },
  violet: {
    text: "text-violet",
    bar: "bg-violet",
    ring: "ring-violet/40",
    glow: "shadow-[0_0_24px_color-mix(in_oklab,var(--color-violet)_20%,transparent)]",
    soft: "bg-violet/12",
  },
};

function readTheme() {
  try {
    const saved = localStorage.getItem(UI_THEME_KEY);
    if (UI_THEMES.some((item) => item.id === saved)) return saved;
  } catch {
    /* ignore */
  }
  return "harbor";
}

function applyTheme(id) {
  const theme = UI_THEMES.find((item) => item.id === id) || UI_THEMES[0];
  document.documentElement.setAttribute("data-ui-theme", theme.id);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme.meta);
}

const ThemeContext = createContext({
  theme: "harbor",
  setTheme: () => {},
  themes: UI_THEMES,
  current: UI_THEMES[0],
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(UI_THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const value = useMemo(() => {
    const current = UI_THEMES.find((item) => item.id === theme) || UI_THEMES[0];
    return {
      theme,
      setTheme: setThemeState,
      themes: UI_THEMES,
      current,
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useUiTheme() {
  return useContext(ThemeContext);
}

export function ThemeStrip({ compact = false }) {
  const { theme, setTheme, themes } = useUiTheme();
  return (
    <div className={`ui-theme-strip${compact ? " is-compact" : ""}`}>
      {themes.map((item) => {
        const on = theme === item.id;
        return (
          <button
            key={item.id}
            type="button"
            title={`${item.label} — ${item.hint}`}
            aria-label={`Use ${item.label} look`}
            aria-pressed={on}
            className={`ui-theme-chip ${on ? "is-on" : ""}`}
            onClick={() => setTheme(item.id)}
          >
            <span className="ui-theme-swatches" aria-hidden>
              {item.swatches.map((color) => (
                <i key={color} style={{ background: color }} />
              ))}
            </span>
            {compact ? null : (
              <span className="ui-theme-copy">
                <strong>{item.label}</strong>
                <em>{item.hint}</em>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
