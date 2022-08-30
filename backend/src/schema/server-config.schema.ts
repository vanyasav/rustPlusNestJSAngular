import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ServerConfigDocument = ServerConfig & Document;

@Schema()
export class ServerConfig {
  @Prop()
  serverName: string;

  @Prop()
  serverIp: string;

  @Prop()
  appPort: number;

  @Prop()
  playerToken: string;

  @Prop()
  isSelected: boolean;
}

export const ServerConfigSchema = SchemaFactory.createForClass(ServerConfig);
