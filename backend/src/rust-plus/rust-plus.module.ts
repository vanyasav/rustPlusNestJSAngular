import { Module } from '@nestjs/common';
import { RustPlusService } from './rust-plus.service';
import { RustPlusController } from './rust-plus.controller';
import { RustPlusHandlerService } from './rust-plus-handler.service';
import { MapService } from './helpers/map.service';
import { ServersModule } from 'src/servers/servers.module';

@Module({
  controllers: [RustPlusController],
  providers: [RustPlusService, RustPlusHandlerService, MapService],
  imports: [ServersModule],
})
export class RustPlusModule {}
