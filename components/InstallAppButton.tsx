"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "./AppIcons";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function InstallAppButton() {
  const router = useRouter();
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const checkStandalone = () => {
      setStandalone(
        media.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
      );
    };
    checkStandalone();
    setReady(true);

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    media.addEventListener?.("change", checkStandalone);
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      media.removeEventListener?.("change", checkStandalone);
    };
  }, []);

  async function handleInstall() {
    if (standalone) return;
    if (!promptEvent) {
      router.push("/install");
      return;
    }
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  }

  if (!ready || standalone) return null;

  return (
    <button
      type="button"
      onClick={handleInstall}
      aria-label="Install Reuse & Connect app"
      title="Install Reuse & Connect app"
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-[#B7DAB9] bg-[#F1F8F2] px-2.5 text-xs font-semibold text-[#166534] shadow-sm transition hover:border-[#86C88B] hover:bg-[#E8F5E9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] sm:h-10 sm:px-3"
    >
      <Download size={15} strokeWidth={2.2} aria-hidden="true" />
      <span className="mobile-install-label sm:hidden">Install</span><span className="hidden sm:inline">Install App</span>
    </button>
  );
}
