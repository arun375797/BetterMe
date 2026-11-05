import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

export const UI_THEME_KEY = "ui-theme";
export const WALLPAPER_SETTINGS_KEY = "ui-wallpaper-settings-v1";
const WALLPAPER_DB = "betterme-appearance";
const WALLPAPER_STORE = "assets";
const WALLPAPER_ID = "wallpaper";
const DEFAULT_WALLPAPER = { opacity: 36, blur: 0, dim: 45, fit: "cover", position: "center" };

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

function readWallpaperSettings() {
  try {
    return { ...DEFAULT_WALLPAPER, ...JSON.parse(localStorage.getItem(WALLPAPER_SETTINGS_KEY) || "{}") };
  } catch {
    return DEFAULT_WALLPAPER;
  }
}

function wallpaperDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(WALLPAPER_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(WALLPAPER_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readWallpaperBlob() {
  if (typeof indexedDB === "undefined") return null;
  const db = await wallpaperDb();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(WALLPAPER_STORE).objectStore(WALLPAPER_STORE).get(WALLPAPER_ID);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

async function writeWallpaperBlob(blob) {
  const db = await wallpaperDb();
  try {
    await new Promise((resolve, reject) => {
      const request = db.transaction(WALLPAPER_STORE, "readwrite").objectStore(WALLPAPER_STORE).put(blob, WALLPAPER_ID);
      request.onsuccess = resolve;
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

async function deleteWallpaperBlob() {
  const db = await wallpaperDb();
  try {
    await new Promise((resolve, reject) => {
      const request = db.transaction(WALLPAPER_STORE, "readwrite").objectStore(WALLPAPER_STORE).delete(WALLPAPER_ID);
      request.onsuccess = resolve;
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

const ThemeContext = createContext({
  theme: "harbor",
  setTheme: () => {},
  themes: UI_THEMES,
  current: UI_THEMES[0],
  wallpaper: DEFAULT_WALLPAPER,
  wallpaperUrl: "",
  setWallpaper: () => {},
  setWallpaperFile: async () => {},
  setWallpaperFromUrl: async () => {},
  removeWallpaper: async () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readTheme);
  const [wallpaper, setWallpaperState] = useState(readWallpaperSettings);
  const [wallpaperUrl, setWallpaperUrl] = useState(() => readWallpaperSettings().remoteUrl || "");
  const wallpaperUrlRef = useRef("");
  const wallpaperObjectUrlRef = useRef(false);

  function showWallpaper(source, isBlob = false) {
    if (wallpaperUrlRef.current && wallpaperObjectUrlRef.current) URL.revokeObjectURL(wallpaperUrlRef.current);
    const next = isBlob && source ? URL.createObjectURL(source) : source || "";
    wallpaperUrlRef.current = next;
    wallpaperObjectUrlRef.current = Boolean(isBlob && source);
    setWallpaperUrl(next);
  }

  useEffect(() => {
    let live = true;
    if (!wallpaper.remoteUrl) {
      readWallpaperBlob().then((blob) => {
        if (live && blob) showWallpaper(blob, true);
      }).catch(() => {});
    }
    return () => {
      live = false;
      if (wallpaperUrlRef.current && wallpaperObjectUrlRef.current) URL.revokeObjectURL(wallpaperUrlRef.current);
    };
  }, []);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(UI_THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(WALLPAPER_SETTINGS_KEY, JSON.stringify(wallpaper));
    } catch {
      /* ignore */
    }
  }, [wallpaper]);

  const value = useMemo(() => {
    const current = UI_THEMES.find((item) => item.id === theme) || UI_THEMES[0];
    return {
      theme,
      setTheme: setThemeState,
      themes: UI_THEMES,
      current,
      wallpaper,
      wallpaperUrl,
      setWallpaper: (patch) => setWallpaperState((currentSettings) => ({ ...currentSettings, ...patch })),
      setWallpaperFile: async (file) => {
        await writeWallpaperBlob(file);
        setWallpaperState((currentSettings) => ({ ...currentSettings, remoteUrl: "" }));
        showWallpaper(file, true);
      },
      setWallpaperFromUrl: async (remoteUrl) => {
        await deleteWallpaperBlob();
        setWallpaperState((currentSettings) => ({ ...currentSettings, remoteUrl }));
        showWallpaper(remoteUrl);
      },
      removeWallpaper: async () => {
        await deleteWallpaperBlob();
        setWallpaperState((currentSettings) => ({ ...currentSettings, remoteUrl: "" }));
        showWallpaper("");
      },
    };
  }, [theme, wallpaper, wallpaperUrl]);

  return (
    <ThemeContext.Provider value={value}>
      {wallpaperUrl ? (
        <div className="ui-wallpaper-layer" aria-hidden="true">
          <img
            src={wallpaperUrl}
            alt=""
            style={{
              opacity: wallpaper.opacity / 100,
              filter: `blur(${wallpaper.blur}px)`,
              objectFit: wallpaper.fit,
              objectPosition: wallpaper.position,
            }}
          />
          <span style={{ opacity: wallpaper.dim / 100 }} />
        </div>
      ) : null}
      {children}
    </ThemeContext.Provider>
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

export function WallpaperControls() {
  const { wallpaper, wallpaperUrl, setWallpaper, setWallpaperFile, setWallpaperFromUrl, removeWallpaper } = useUiTheme();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [imageUrl, setImageUrl] = useState(wallpaper.remoteUrl || "");
  const input = useRef(null);

  async function pick(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choose a JPG, PNG, WebP, GIF, or another image file.");
    if (file.size > 20 * 1024 * 1024) return setError("Choose an image smaller than 20 MB.");
    setBusy(true);
    setError("");
    try {
      await setWallpaperFile(file);
    } catch {
      setError("The browser could not save this wallpaper.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError("");
    try {
      await removeWallpaper();
    } catch {
      setError("The browser could not remove this wallpaper.");
    } finally {
      setBusy(false);
    }
  }

  async function useImageUrl(event) {
    event.preventDefault();
    const value = imageUrl.trim();
    let parsed;
    try {
      parsed = new URL(value);
      if (!/^https?:$/.test(parsed.protocol)) throw new Error();
    } catch {
      setError("Enter a complete http:// or https:// image URL.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await validateImageUrl(parsed.href);
      await setWallpaperFromUrl(parsed.href);
      setImageUrl(parsed.href);
    } catch {
      setError("That URL could not be loaded as an image. Check the link or try another one.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ui-wallpaper-controls">
      <input ref={input} type="file" accept="image/*" className="sr-only" onChange={pick} />
      <div className="flex items-center gap-2">
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className="ui-wallpaper-button">
          {wallpaperUrl ? "Change wallpaper" : "Add wallpaper"}
        </button>
        {wallpaperUrl ? <button type="button" disabled={busy} onClick={remove} className="ui-wallpaper-remove">Remove</button> : null}
      </div>
      <div className="my-3 flex items-center gap-2 text-[10px] text-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">OR</div>
      <form onSubmit={useImageUrl} className="space-y-2">
        <label className="block text-[11px] text-muted" htmlFor="wallpaper-image-url">Image URL</label>
        <input
          id="wallpaper-image-url"
          type="url"
          inputMode="url"
          value={imageUrl}
          disabled={busy}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="https://example.com/wallpaper.jpg"
          className="ui-wallpaper-url"
        />
        <button type="submit" disabled={busy || !imageUrl.trim()} className="ui-wallpaper-url-button">
          {busy ? "Loading…" : "Use image URL"}
        </button>
      </form>
      {error ? <p role="alert" className="mt-2 text-[11px] text-coral">{error}</p> : null}
      {wallpaperUrl ? (
        <div className="mt-4 space-y-3">
          <RangeControl label="Visibility" value={wallpaper.opacity} min={5} max={100} suffix="%" onChange={(opacity) => setWallpaper({ opacity })} />
          <RangeControl label="Dark overlay" value={wallpaper.dim} min={0} max={85} suffix="%" onChange={(dim) => setWallpaper({ dim })} />
          <RangeControl label="Blur" value={wallpaper.blur} min={0} max={24} suffix="px" onChange={(blur) => setWallpaper({ blur })} />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] text-muted">Fit
              <select value={wallpaper.fit} onChange={(e) => setWallpaper({ fit: e.target.value })} className="ui-wallpaper-select">
                <option value="cover">Fill screen</option><option value="contain">Fit image</option>
              </select>
            </label>
            <label className="text-[11px] text-muted">Position
              <select value={wallpaper.position} onChange={(e) => setWallpaper({ position: e.target.value })} className="ui-wallpaper-select">
                <option value="center">Center</option><option value="top">Top</option><option value="bottom">Bottom</option><option value="left">Left</option><option value="right">Right</option>
              </select>
            </label>
          </div>
          <button type="button" onClick={() => setWallpaper(DEFAULT_WALLPAPER)} className="text-[11px] text-cyan hover:underline">Reset wallpaper adjustments</button>
        </div>
      ) : <p className="mt-2 text-[11px] leading-4 text-muted">Your image stays in this browser and is displayed behind the app.</p>}
    </div>
  );
}

function validateImageUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = window.setTimeout(() => {
      image.src = "";
      reject(new Error("Image timed out"));
    }, 15_000);
    image.onload = () => {
      window.clearTimeout(timeout);
      if (image.naturalWidth && image.naturalHeight) resolve();
      else reject(new Error("Invalid image"));
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("Image failed"));
    };
    image.referrerPolicy = "no-referrer";
    image.src = url;
  });
}

function RangeControl({ label, value, min, max, suffix, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 flex justify-between text-[11px] text-muted"><span>{label}</span><span>{value}{suffix}</span></span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="ui-wallpaper-range" />
    </label>
  );
}
