"use client";

const ALARM_CHANNEL_NAME = "nearer_cross_tab_alarm_sync";
const SILENCE_STORAGE_KEY = "nearer_alarm_silenced_timestamp";

class AlarmCoordinator {
  private channel: BroadcastChannel | null = null;
  private tabId = Math.random().toString(36).substring(2, 9);
  private onSilenceCallbacks: Set<() => void> = new Set();
  private isLocallyPlaying = false;

  constructor() {
    if (typeof window !== "undefined") {
      // 1. Setup BroadcastChannel for cross-tab audio arbitration
      if ("BroadcastChannel" in window) {
        try {
          this.channel = new BroadcastChannel(ALARM_CHANNEL_NAME);
          this.channel.onmessage = (event) => {
            if (event.data?.type === "SILENCE_ALL") {
              this.forceStopLocal();
              this.onSilenceCallbacks.forEach((cb) => cb());
            } else if (event.data?.type === "PLAYING_SIREN") {
              // If another tab is already playing the siren, yield to prevent dual echo
              if (event.data.tabId !== this.tabId && this.isLocallyPlaying) {
                this.forceStopLocal();
              }
            }
          };
        } catch (e) {
          console.warn("BroadcastChannel notice:", e);
        }
      }

      // 2. Storage fallback for cross-tab sync
      window.addEventListener("storage", (e) => {
        if (e.key === SILENCE_STORAGE_KEY) {
          this.forceStopLocal();
          this.onSilenceCallbacks.forEach((cb) => cb());
        }
      });
    }
  }

  public onRemoteSilence(callback: () => void) {
    this.onSilenceCallbacks.add(callback);
    return () => {
      this.onSilenceCallbacks.delete(callback);
    };
  }

  public playSiren(): Promise<void> | undefined {
    if (typeof window === "undefined") return;
    const audio = this.getAudio();
    if (!audio) return;

    // Notify all other open tabs to yield audio playback to avoid dual echoes
    this.channel?.postMessage({ type: "PLAYING_SIREN", tabId: this.tabId });

    audio.muted = false;
    this.isLocallyPlaying = true;
    return audio.play();
  }

  public silenceAllTabs() {
    this.forceStopLocal();
    this.channel?.postMessage({ type: "SILENCE_ALL", tabId: this.tabId });
    try {
      localStorage.setItem(SILENCE_STORAGE_KEY, Date.now().toString());
    } catch {}
  }

  public forceStopLocal() {
    this.isLocallyPlaying = false;
    if (typeof window === "undefined") return;
    try {
      const audio = (window as any).__nearer_alarm_audio as HTMLAudioElement | undefined;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = true;
      }
      // Safety sweep: pause any audio elements in the page
      document.querySelectorAll("audio").forEach((a) => {
        try {
          a.pause();
          a.currentTime = 0;
          a.muted = true;
        } catch {}
      });
    } catch {}
  }

  public getAudio(): HTMLAudioElement | null {
    if (typeof window === "undefined") return null;
    if (!(window as any).__nearer_alarm_audio) {
      const audio = new Audio("/emergency-alarm.mp3");
      audio.loop = true;
      (window as any).__nearer_alarm_audio = audio;
    }
    return (window as any).__nearer_alarm_audio;
  }
}

export const alarmCoordinator = new AlarmCoordinator();
