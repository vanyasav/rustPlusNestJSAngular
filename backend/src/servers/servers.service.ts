import { Injectable } from '@nestjs/common';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ServerConfig } from '../schema/server-config.schema';

@Injectable()
export class ServersService {
  constructor(
    @InjectModel(ServerConfig.name) private serverConfig: Model<ServerConfig>,
  ) {}

  async create(createServerDto: CreateServerDto): Promise<ServerConfig> {
    const createdServer = new this.serverConfig(createServerDto);
    return createdServer.save();
  }

  async findAll(): Promise<ServerConfig[]> {
    return this.serverConfig.find().exec();
  }

  findOne(id: number) {
    return `This action returns a #${id} server`;
  }

  update(id: number, updateServerDto: UpdateServerDto) {
    return `This action updates a #${id} server`;
  }

  remove(id: number) {
    return `This action removes a #${id} server`;
  }
}
