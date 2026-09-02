import { useEffect, useRef, useState } from "react";
import { login } from "../api.js";
import { readSession, saveSession } from "../authSession.js";
import Logo from "../components/Logo.jsx";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export default function LoginPage({ onUnlocked }) {
  const [digits, setDigits] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const hiddenRef = useRef(null);
  const submitting = useRef(false);

  useEffect(() => {
    hiddenRef.current?.focus();
  }, []);

  useEffect(() => {
    if (digits.length !== 4 || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    login(digits)
      .then((session) => {
        const saved = saveSession(session) || readSession();
        if (!saved?.token) {
          throw new Error("Could not keep you signed in. Try again.");
        }
        onUnlocked(saved);
      })
      .catch((err) => {
        setError(err.message || "Wrong password. Try again.");
        setShake(true);
        setDigits("");
        window.setTimeout(() => setShake(false), 420);
        hiddenRef.current?.focus();
      })
      .finally(() => {
        submitting.current = false;
        setBusy(false);
      });
  }, [digits, onUnlocked]);

  function pushDigit(d) {
    if (busy) return;
    setError("");
    setDigits((prev) => (prev.length >= 4 ? prev : prev + d));
  }

  function backspace() {
    if (busy) return;
    setError("");
    setDigits((prev) => prev.slice(0, -1));
  }

  function onHiddenChange(e) {
    const next = e.target.value.replace(/\D/g, "").slice(0, 4);
    setError("");
    setDigits(next);
  }

  function onHiddenKeyDown(e) {
    if (e.key === "Backspace" && !digits) {
      e.preventDefault();
      backspace();
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        aria-hidden
        style={{
          background:
            "radial-gradient(900px 480px at 18% -8%, rgba(60,230,212,0.16), transparent 58%), radial-gradient(700px 420px at 92% 8%, rgba(232,195,106,0.12), transparent 52%), radial-gradient(600px 360px at 50% 110%, rgba(185,166,255,0.08), transparent 55%)",
        }}
      />
      <div className="relative w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo iconClass="h-11 w-11" />
          <p className="mt-5 text-[11px] tracking-[0.22em] text-muted uppercase">
            Private space
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">
            Unlock BetterMe
          </h1>
          <p className="mt-2 max-w-xs text-sm text-muted">
            Enter your password. You’ll stay signed in for 4 hours.
          </p>
        </div>

        <div
          className={`rounded-2xl border border-white/10 bg-[#1e2434]/90 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.45)] ring-1 ring-white/5 backdrop-blur-md sm:p-7 ${
            shake ? "pin-shake" : ""
          }`}
          onClick={() => hiddenRef.current?.focus()}
        >
          <input
            ref={hiddenRef}
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            maxLength={4}
            value={digits}
            onChange={onHiddenChange}
            onKeyDown={onHiddenKeyDown}
            className="sr-only"
            aria-label="Password"
            disabled={busy}
          />

          <div className="mb-6 flex justify-center gap-2 sm:gap-3">
            {[0, 1, 2, 3].map((i) => {
              const filled = i < digits.length;
              const active = i === digits.length && !busy;
              return (
                <span
                  key={i}
                  className={`flex h-12 w-10 items-center justify-center rounded-xl border text-xl font-semibold transition sm:h-14 sm:w-12 ${
                    filled
                      ? "border-teal/50 bg-teal/12 text-teal shadow-[0_0_20px_rgba(60,230,212,0.12)]"
                      : active
                        ? "border-gold/45 bg-white/6 text-ink"
                        : "border-white/10 bg-[#171c2a] text-muted"
                  }`}
                >
                  {filled ? "•" : ""}
                </span>
              );
            })}
          </div>

          <p
            className={`mb-4 min-h-5 text-center text-sm ${
              error ? "text-coral" : "text-transparent"
            }`}
            role="alert"
          >
            {error || "."}
          </p>

          <div className="grid grid-cols-3 gap-2">
            {KEYS.map((key, idx) => {
              if (key === "") {
                return <span key={idx} />;
              }
              if (key === "del") {
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={backspace}
                    disabled={busy}
                    className="rounded-xl py-3.5 text-sm font-medium text-muted transition hover:bg-white/8 hover:text-ink disabled:opacity-40"
                  >
                    Delete
                  </button>
                );
              }
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => pushDigit(key)}
                  disabled={busy}
                  className="rounded-xl bg-white/5 py-3.5 text-lg font-semibold text-ink transition hover:bg-teal/15 hover:text-teal disabled:opacity-40"
                >
                  {key}
                </button>
              );
            })}
          </div>

          {busy ? (
            <p className="mt-4 text-center text-xs tracking-wide text-muted">
              Checking…
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
