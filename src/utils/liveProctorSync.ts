import { ExamSubmission, LiveParticipant } from '../types/cbt';

export type LiveSyncMessage =
  | {
      type: 'STUDENT_PROGRESS';
      scheduleId: string;
      packetId: string;
      participant: LiveParticipant;
      timestamp: number;
    }
  | {
      type: 'STUDENT_SUBMITTED';
      scheduleId: string;
      packetId: string;
      participant: LiveParticipant;
      submission: ExamSubmission;
      timestamp: number;
    }
  | {
      type: 'PROCTOR_ACTION';
      scheduleId: string;
      packetId: string;
      studentId: string;
      nomorPeserta: string;
      action: 'RESET_LOGIN' | 'ADD_TIME' | 'FORCE_SUBMIT' | 'RESET_SUBMIT';
      addedMinutes?: number;
      timestamp: number;
    }
  | {
      type: 'PROCTOR_BULK_ACTION';
      scheduleId: string;
      packetId: string;
      action: 'BULK_RESET_LOGIN' | 'BULK_ADD_TIME';
      addedMinutes?: number;
      timestamp: number;
    }
  | {
      type: 'PROCTOR_BROADCAST';
      scheduleId: string;
      packetId: string;
      announcement?: string;
      token?: string;
      timestamp: number;
    };

const CHANNEL_NAME = 'jn_examcbtcore_live_sync_v3';
const STORAGE_BUS_KEY = 'jn_cbt_live_event_bus_v3';
const DOM_EVENT_NAME = 'jn-cbt-live-sync';

let sharedChannel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null;
  }
  if (!sharedChannel) {
    try {
      sharedChannel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      sharedChannel = null;
    }
  }
  return sharedChannel;
}

/**
 * Publishes a real-time CBT synchronization event across all open tabs (via BroadcastChannel
 * and localStorage storage event), within the current tab (via CustomEvent),
 * and across LAN devices via the SQLite Server Event Bus (/api/cbt/events).
 */
export function publishLiveSyncEvent(message: LiveSyncMessage): void {
  try {
    const ch = getChannel();
    if (ch) {
      ch.postMessage(message);
    }
  } catch {
    // Fallback to storage & custom event
  }

  try {
    localStorage.setItem(STORAGE_BUS_KEY, JSON.stringify(message));
  } catch {
    // Ignore quota errors
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<LiveSyncMessage>(DOM_EVENT_NAME, { detail: message }));
    // Push to LAN SQLite Server Event Bus
    fetch('/api/cbt/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    }).catch(() => {
      // Offline / static fallback
    });
  }
}

/**
 * Subscribes to real-time CBT synchronization events from other browser tabs,
 * the current tab, and other devices on the school LAN via SQLite Event Bus polling.
 */
export function subscribeLiveSyncEvents(
  handler: (message: LiveSyncMessage) => void
): () => void {
  const processedTimestamps = new Set<number>();
  let latestServerTs = Date.now() - 5000;

  const processMessage = (msg: LiveSyncMessage | null | undefined) => {
    if (!msg || typeof msg !== 'object' || !msg.type) return;
    if (msg.timestamp) {
      if (processedTimestamps.has(msg.timestamp)) return;
      processedTimestamps.add(msg.timestamp);
      if (msg.timestamp > latestServerTs) {
        latestServerTs = msg.timestamp;
      }
      if (processedTimestamps.size > 500) {
        const first = processedTimestamps.values().next().value;
        if (first !== undefined) processedTimestamps.delete(first);
      }
    }
    handler(msg);
  };

  let tabChannel: BroadcastChannel | null = null;
  if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
    try {
      tabChannel = new BroadcastChannel(CHANNEL_NAME);
      tabChannel.onmessage = (ev: MessageEvent<LiveSyncMessage>) => {
        processMessage(ev.data);
      };
    } catch {
      tabChannel = null;
    }
  }

  const handleStorage = (ev: StorageEvent) => {
    if (ev.key === STORAGE_BUS_KEY && ev.newValue) {
      try {
        const parsed = JSON.parse(ev.newValue) as LiveSyncMessage;
        processMessage(parsed);
      } catch {
        // Ignore malformed JSON
      }
    }
  };

  const handleDomEvent = (ev: Event) => {
    const customEv = ev as CustomEvent<LiveSyncMessage>;
    processMessage(customEv.detail);
  };

  let pollTimer: ReturnType<typeof setInterval> | null = null;
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
    window.addEventListener(DOM_EVENT_NAME, handleDomEvent);

    pollTimer = setInterval(async () => {
      try {
        const res = await fetch(`/api/cbt/events?since=${latestServerTs}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.ok && Array.isArray(data.events)) {
          data.events.forEach((ev: LiveSyncMessage) => processMessage(ev));
        }
      } catch {
        // Ignore polling errors
      }
    }, 3000);
  }

  return () => {
    if (tabChannel) {
      try {
        tabChannel.close();
      } catch {
        // Ignore close error
      }
    }
    if (pollTimer) {
      clearInterval(pollTimer);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(DOM_EVENT_NAME, handleDomEvent);
    }
  };
}
