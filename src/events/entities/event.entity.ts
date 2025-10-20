export class Event {
  timestamp: Date;
  messageId: string;
  data: EventData;
}

export class EventData {
  data: any;
  method: string;
  className: string;
  unico: string;
  filialId: number;
  filialCnpj: string;
}

