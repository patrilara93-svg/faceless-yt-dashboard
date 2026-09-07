export interface QueueTopic {
  topic: string;
}

export interface StatusPayload {
  topic?: string;
  phase?: string;
  format?: string;
  updated_at?: number;
  extra?: Record<string, unknown>;
}

export interface QuotaPayload {
  date?: string;
  units_used?: number;
  daily_limit?: number;
  remaining?: number;
  soft_threshold?: number;
  over_soft_threshold?: boolean;
  updated_at?: number;
}

export interface ServicesPayload {
  tts_provider?: string;
  yt_default_privacy?: string;
  dry_run?: string;
  last_sync_at?: number;
}

export interface HistoryRecord {
  timestamp?: number;
  topic?: string;
  status?: string;
  title?: string;
  video_url?: string;
  error?: string;
  format?: string;
  file_path?: string;
}
