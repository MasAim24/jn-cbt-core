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
      action: 'RESET_LOGIN' | 'ADD_TIME' | 'FORCE_SUBMIT';
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

const CHANNEL_NAME = 'jn_examcbtcore_live_sync_v2';
const STORAGE_BUS_KEY = 'jn_cbt_live_event_bus_v2';
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
 * and localStorage storage event) as well as within the current tab (via CustomEvent).
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
  }
}

/**
 * Subscribes to real-time CBT synchronization events from both other browser tabs
 * and the current tab. Returns an unsubscribe cleanup function.
 */
export function subscribeLiveSyncEvents(
  handler: (message: LiveSyncMessage) => void
): () => void {
  let lastProcessedTimestamp = 0;

  const processMessage = (msg: LiveSyncMessage | null | undefined) => {
    if (!msg || typeof msg !== 'object' || !msg.type) return;
    // Deduplicate identical messages arriving via both BroadcastChannel and storage event
    if (msg.timestamp && msg.timestamp === lastProcessedTimestamp) return;
    if (msg.timestamp) {
      lastProcessedTimestamp = msg.timestamp;
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

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
    window.addEventListener(DOM_EVENT_NAME, handleDomEvent);
  }

  return () => {
    if (tabChannel) {
      try {
        tabChannel.close();
      } catch {
        // Ignore close error
      }
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(DOM_EVENT_NAME, handleDomEvent);
    }
  };
}
