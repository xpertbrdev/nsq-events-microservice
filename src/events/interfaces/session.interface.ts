import { SessionStatus } from '../enums/session-status.enum';

export interface ISession {
  id: string;
  status: SessionStatus;
  createdAt: Date;
  eventCount: number;
  updatedAt?: Date;
  // Informações do tópico NSQ
  ambiente: string;
  matrizId: string;
  matrizCNPJ: string;
  sender: string;
  topic?: string; // Formato: ambiente-matrizId-matrizCNPJ-sender
}

