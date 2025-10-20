import { SessionStatus } from '../enums/session-status.enum';

export class EventSession {
  id: string;
  userId: string;
  status: SessionStatus;
  createdAt: Date;
  eventCount: number;
  updatedAt?: Date;
  // Informações do tópico NSQ
  ambiente: string;
  matrizId: string;
  matrizCNPJ: string;
  sender: string;
  topic?: string;
}

