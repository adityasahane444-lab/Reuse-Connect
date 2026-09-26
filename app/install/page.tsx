"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function InstallPage() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        ("standalone" in navigator &&
          Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
    );

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <main className="install-page mx-auto w-full max-w-2xl px-4 py-8 sm:px-5 sm:py-12">
      <div className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm sm:p-10">
        <div className="mb-6 text-5xl">🌱</div>
        <h1 className="text-2xl font-bold sm:text-3xl text-gray-900">Install Reuse &amp; Connect</h1>
        <p className="mt-3 text-gray-600">
          Install Reuse &amp; Connect on your phone for an app-like experience.
        </p>

        {isStandalone ? (
          <div className="mt-6 rounded-xl bg-green-50 p-4 text-green-800">
            Reuse &amp; Connect is already installed on this device.
          </div>
        ) : installPrompt ? (
          <button
            type="button"
            onClick={install}
            className="mt-7 w-full rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800 sm:w-auto"
          >
            Install App
          </button>
        ) : (
          <div className="mt-7 space-y-4 text-sm text-gray-700">
            <div className="rounded-xl bg-gray-50 p-4">
              <strong>Android / Chrome:</strong> open the browser menu and choose
              <strong> Install app</strong> or <strong>Add to Home screen</strong>.
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <strong>iPhone / iPad:</strong> open this website in Safari, tap
              <strong> Share</strong>, then choose <strong>Add to Home Screen</strong>.
            </div>
          </div>
        )}

        <p className="mt-8 text-sm text-gray-500">
          Your account, listings, messages, requests and other data continue to use the same Reuse &amp; Connect backend.
        </p>
      </div>
    </main>
  );
}
