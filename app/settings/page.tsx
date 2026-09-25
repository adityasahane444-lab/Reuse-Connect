"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/useUser";
import { DEFAULT_PREFERENCES, type Preferences } from "@/lib/types";
import { MIN_PASSWORD_LENGTH } from "@/lib/constants";
import LoginPrompt from "@/components/LoginPrompt";

const TOGGLES: { key: keyof Preferences; label: string; hint: string }[] = [
  { key: "allowMessages", label: "Allow messages from anyone", hint: "Off restricts DMs to people you've had an exchange with." },
  { key: "notifyExchanges", label: "Exchange requests & ratings", hint: "Requests, acceptances, completions and reviews." },
  { key: "notifyEvents", label: "Event join alerts", hint: "When someone joins an event you organize." },
  { key: "notifyExpiry", label: "Food expiry reminders", hint: "When an accepted food pickup is about to expire." },
];

export default function SettingsPage() {
  const { user, loading: userLoading, refresh } = useUser();
  const router = useRouter();

  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [savingKey, setSavingKey] = useState<keyof Preferences | null>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [delPw, setDelPw] = useState("");
  const [delConfirm, setDelConfirm] = useState("");
  const [delBusy, setDelBusy] = useState(false);
  const [delErr, setDelErr] = useState("");
  const [delOpen, setDelOpen] = useState(false);

  const loadPrefs = useCallback(() => {
    if (user) setPrefs(user.preferences);
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seed toggles from the freshly loaded user
    loadPrefs();
  }, [loadPrefs]);

  async function togglePref(key: keyof Preferences) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSavingKey(key);
    const res = await fetch("/api/settings/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: next[key] }),
    });
    setSavingKey(null);
    if (!res.ok) setPrefs(prefs); // revert on failure
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    setPwBusy(true);
    const res = await fetch("/api/settings/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    const body = await res.json().catch(() => ({}));
    setPwBusy(false);
    if (!res.ok) {
      setPwMsg({ ok: false, text: body.error ?? "Could not change your password." });
      return;
    }
    setCurrentPw("");
    setNewPw("");
    setPwMsg({ ok: true, text: "Password changed. You're signed out on other devices." });
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDelErr("");
    setDelBusy(true);
    const res = await fetch("/api/settings/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: delPw, confirm: delConfirm }),
    });
    const body = await res.json().catch(() => ({}));
    setDelBusy(false);
    if (!res.ok) {
      setDelErr(body.error ?? "Could not delete your account.");
      return;
    }
    await refresh();
    router.push("/");
    router.refresh();
  }

  if (userLoading) return <main className="flex-1 bg-[#F7FAF7] px-4 py-10" />;
  if (!user) return <LoginPrompt message="Please log in to change your settings." />;

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]";

  return (
    <main className="flex-1 bg-[#F7FAF7] px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold text-[#1F2937]">Settings</h1>

        <section className="rounded-2xl border border-[#E8F5E9] bg-white p-6">
          <h2 className="text-lg font-bold text-[#1F2937]">Privacy & notifications</h2>
          <div className="mt-4 divide-y divide-gray-50">
            {TOGGLES.map((t) => (
              <div key={t.key} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[#1F2937]">{t.label}</p>
                  <p className="text-xs text-[#6B7280]">{t.hint}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={prefs[t.key]}
                  aria-label={t.label}
                  onClick={() => togglePref(t.key)}
                  disabled={savingKey === t.key}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${prefs[t.key] ? "bg-[#2E7D32]" : "bg-gray-300"} disabled:opacity-60`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${prefs[t.key] ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#E8F5E9] bg-white p-6">
          <h2 className="text-lg font-bold text-[#1F2937]">Change password</h2>
          <form onSubmit={changePassword} className="mt-4 space-y-3">
            {pwMsg && (
              <p className={`rounded-md px-3 py-1.5 text-xs ${pwMsg.ok ? "bg-[#E8F5E9] text-[#256428]" : "bg-red-50 text-red-700"}`}>
                {pwMsg.text}
              </p>
            )}
            <div>
              <label htmlFor="cur-pw" className="mb-1 block text-sm font-medium text-[#1F2937]">Current password</label>
              <input id="cur-pw" type="password" required autoComplete="current-password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="new-pw" className="mb-1 block text-sm font-medium text-[#1F2937]">New password</label>
              <input
                id="new-pw"
                type="password"
                required
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className={inputClass}
              />
            </div>
            <button type="submit" disabled={pwBusy} className="rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#256428] disabled:opacity-60">
              {pwBusy ? "Changing…" : "Change password"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-red-100 bg-white p-6">
          <h2 className="text-lg font-bold text-red-700">Delete account</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            This permanently deletes your account, listings, messages and history. This can&apos;t be undone.
          </p>
          {!delOpen ? (
            <button onClick={() => setDelOpen(true)} className="mt-4 rounded-lg border border-red-600 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
              Delete my account
            </button>
          ) : (
            <form onSubmit={deleteAccount} className="mt-4 space-y-3">
              {delErr && <p className="rounded-md bg-red-50 px-3 py-1.5 text-xs text-red-700">{delErr}</p>}
              <div>
                <label htmlFor="del-pw" className="mb-1 block text-sm font-medium text-[#1F2937]">Confirm your password</label>
                <input id="del-pw" type="password" required autoComplete="current-password" value={delPw} onChange={(e) => setDelPw(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="del-confirm" className="mb-1 block text-sm font-medium text-[#1F2937]">
                  Type <span className="font-mono">DELETE</span> to confirm
                </label>
                <input id="del-confirm" required value={delConfirm} onChange={(e) => setDelConfirm(e.target.value)} className={inputClass} />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={delBusy || delConfirm !== "DELETE"}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {delBusy ? "Deleting…" : "Permanently delete"}
                </button>
                <button type="button" onClick={() => setDelOpen(false)} className="rounded-lg px-4 py-2 text-sm text-[#6B7280] hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
