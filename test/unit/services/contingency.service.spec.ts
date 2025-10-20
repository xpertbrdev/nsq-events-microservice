import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ContingencyService } from '../../../src/events/services/contingency.service';
import * as fs from 'fs';

jest.mock('fs');

describe('ContingencyService', () => {
  let service: ContingencyService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContingencyService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('./test-contingency.jsonl'),
          },
        },
      ],
    }).compile();

    service = module.get<ContingencyService>(ContingencyService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveToFile', () => {
    it('should save data to contingency file', async () => {
      const mockData = [
        { type: 'event', data: { test: 'data' } },
      ];

      (fs.promises.appendFile as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      await service.saveToFile(mockData);

      expect(fs.promises.appendFile).toHaveBeenCalled();
    });
  });
});

