import { Test, TestingModule } from '@nestjs/testing';
import { RustPlusHandlerService } from './rust-plus-handler.service';

describe('RustPlusHandlerService', () => {
  let service: RustPlusHandlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RustPlusHandlerService],
    }).compile();

    service = module.get<RustPlusHandlerService>(RustPlusHandlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
