import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ContingencyService {
  private readonly logger = new Logger(ContingencyService.name);
  private readonly contingencyFilePath: string;

  constructor(private readonly configService: ConfigService) {
    this.contingencyFilePath =
      this.configService.get<string>('CONTINGENCY_FILE_PATH') ||
      './contingency-log.jsonl';

    // Garante que o diretório existe
    const dir = path.dirname(this.contingencyFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Garante que o arquivo existe
    if (!fs.existsSync(this.contingencyFilePath)) {
      fs.writeFileSync(this.contingencyFilePath, '');
    }
  }

  async saveToFile(data: any[]): Promise<void> {
    const lines = data.map((item) => JSON.stringify(item)).join('\n') + '\n';
    try {
      await fs.promises.appendFile(this.contingencyFilePath, lines);
      this.logger.warn(
        `${data.length} items saved to contingency file at ${this.contingencyFilePath}`,
      );
    } catch (error) {
      this.logger.error(
        'CRITICAL: Failed to write to contingency file!',
        error,
      );
      throw error;
    }
  }

  async readFromFile(): Promise<any[]> {
    try {
      const content = await fs.promises.readFile(
        this.contingencyFilePath,
        'utf-8',
      );
      const lines = content
        .split('\n')
        .filter((line) => line.trim().length > 0);
      return lines.map((line) => JSON.parse(line));
    } catch (error) {
      this.logger.error('Failed to read from contingency file', error);
      return [];
    }
  }

  async clearFile(): Promise<void> {
    try {
      await fs.promises.writeFile(this.contingencyFilePath, '');
      this.logger.log('Contingency file cleared');
    } catch (error) {
      this.logger.error('Failed to clear contingency file', error);
    }
  }
}

