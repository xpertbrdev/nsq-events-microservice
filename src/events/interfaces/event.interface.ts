import { EventType } from '../enums/event-type.enum';

export interface IEvent {
  data: any;
  eventType: EventType;
  userId: string;
  FilialIDDestino: string;
  CNPJDestino: string;
  FilialOrigem: string;
  CNPJOrigem: string;
  timestamp?: Date;
}

