import { CreateEventDto } from '../../dto/create-event.dto';

export class AddEventCommand {
  constructor(
    public readonly sessionId: string,
    public readonly eventDto: CreateEventDto,
  ) {}
}

