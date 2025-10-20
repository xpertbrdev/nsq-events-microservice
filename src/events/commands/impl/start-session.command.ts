export class StartSessionCommand {
  constructor(
    public readonly userId: string,
    public readonly filialId: string,
    public readonly filialCNPJ: string,
    public readonly ambiente: string,
    public readonly sender: string,
  ) {}
}

