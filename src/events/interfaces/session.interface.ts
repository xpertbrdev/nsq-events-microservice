import { SessionStatus } from '../enums/session-status.enum';

export interface ISession {
  id: string;
  userId: string;
  status: SessionStatus;
  createdAt: Date;
  eventCount: number;
  updatedAt?: Date;
}

