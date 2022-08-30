import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { RustPlusService } from './rust-plus.service';

@Controller('rust-plus')
export class RustPlusController {
  constructor(private rustPlusService: RustPlusService) {}

  @HttpCode(HttpStatus.OK)
  @Get('/init')
  init(
    @Query('server') server: string,
    @Query('port') port: number,
    @Query('playerId') playerId: number,
    @Query('playerToken') playerToken: number,
  ) {
    return this.rustPlusService.init(server, port, playerId, playerToken);
  }

  @Get('/turnSmartSwitchOn')
  async turnSmartSwitchOn(@Query('id') id: number) {
    try {
      return await this.rustPlusService.turnSmartSwitchOn(id);
    } catch (e) {
      return e;
    }
  }

  @Get('/turnSmartSwitchOff')
  async turnSmartSwitchOff(@Query('id') id: number) {
    try {
      return await this.rustPlusService.turnSmartSwitchOff(id);
    } catch (e) {
      return e;
    }
  }

  @Get('/entityInfo')
  async getEntityInfo(@Query('id') id: number) {
    try {
      return await this.rustPlusService.getEntityInfo(id);
    } catch (e) {
      if (e.error === 'not_found') return 'Entity with id=' + id + ' not found';
      else return e;
    }
  }

  @Get('/mapMarkers')
  async getMapMarkers() {
    try {
      return await this.rustPlusService.getMapMarkers();
      // return await this.rustPlusHandlerService.getAllMarkers();
    } catch (e) {
      return e;
    }
  }

  @Get('/teamChat')
  async getTeamChat() {
    try {
      return await this.rustPlusService.getTeamChat();
    } catch (e) {
      return e;
    }
  }

  @Get('/map')
  async getMap() {
    try {
      return await this.rustPlusService.getMap();
    } catch (e) {
      return e;
    }
  }
}
