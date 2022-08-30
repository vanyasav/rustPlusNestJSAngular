import { Module } from '@nestjs/common';
import { ServersService } from './servers.service';
import { ServersController } from './servers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ServerConfigSchema } from '../schema/server-config.schema';

@Module({
  controllers: [ServersController],
  providers: [ServersService],
  imports: [
    MongooseModule.forFeature([
      { name: 'ServerConfig', schema: ServerConfigSchema },
    ]),
  ],
  exports: [MongooseModule, ServersService],
})
export class ServersModule {}
