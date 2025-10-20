import { EventType } from '../enums/event-type.enum';

export class Event {
  data: any;
  eventType: EventType;
  userId: string;
  FilialIDDestino: string;
  CNPJDestino: string;
  FilialOrigem: string;
  CNPJOrigem: string;
  timestamp: Date;
}

