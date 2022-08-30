import { Test, TestingModule } from '@nestjs/testing';
import { RustPlusController } from './rust-plus.controller';
import { RustPlusService } from './rust-plus.service';

describe('RustPlusController', () => {
  let controller: RustPlusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RustPlusController],
      providers: [RustPlusService],
    }).compile();

    controller = module.get<RustPlusController>(RustPlusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
