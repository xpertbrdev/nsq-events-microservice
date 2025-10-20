export interface IEvent {
  timestamp: Date;
  messageId: string;
  data: IEventData;
}

export interface IEventData {
  data: any;
  method: string;
  className: string;
  unico: string;
  filialId: number;
  filialCnpj: string;
}

