export interface IMetrics {
  totalEvents: number;
  successRate: number;
  averageDuration: number;
  eventsPerMinute: number;
  deadLetterCount: number;
  recentFailures: IFailureRecord[];
}

export interface IFailureRecord {
  timestamp: Date;
  sessionId: string;
  error: string;
  eventCount: number;
}

export interface IProcessingRecord {
  timestamp: Date;
  sessionId: string;
  eventCount: number;
  duration: number;
  success: boolean;
}

