export class StartSessionCommand {
  constructor(
    public readonly filialId: string,
    public readonly filialCNPJ: string,
    public readonly ambiente: string,
    public readonly sender: string,
  ) { }
}

