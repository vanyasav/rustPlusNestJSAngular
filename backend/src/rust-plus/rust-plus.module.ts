import { Module } from '@nestjs/common';
import { RustPlusService } from './services/rust-plus.service';
import { RustPlusController } from './rust-plus.controller';
import { RustPlusHandlerService } from './services/rust-plus-handler.service';
import { MapService } from './helpers/map.service';
import { ServersModule } from 'src/servers/servers.module';
import { TranslationService } from './services/translate.service';

@Module({
  controllers: [RustPlusController],
  providers: [
    RustPlusService,
    RustPlusHandlerService,
    MapService,
    TranslationService,
  ],
  imports: [ServersModule],
})
export class RustPlusModule {}
