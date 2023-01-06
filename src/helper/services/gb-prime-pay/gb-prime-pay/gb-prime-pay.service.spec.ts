import { Test, TestingModule } from '@nestjs/testing';
import { GbPrimePayService } from './gb-prime-pay.service';

describe('GbPrimePayService', () => {
  let service: GbPrimePayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GbPrimePayService],
    }).compile();

    service = module.get<GbPrimePayService>(GbPrimePayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
