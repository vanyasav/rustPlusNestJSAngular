import { Test, TestingModule } from '@nestjs/testing';
import { RustPlusService } from './rust-plus.service';

describe('RustPlusService', () => {
  let service: RustPlusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RustPlusService],
    }).compile();

    service = module.get<RustPlusService>(RustPlusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
