import * as itemList from '../json/items.json';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { RustPlusService } from './rust-plus.service';
import { OnEvent } from '@nestjs/event-emitter';
import { MapService } from '../helpers/map.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { IOilRig } from '../interfaces';
import { ServersService } from '../../servers/servers.service';
import { TranslationService } from './translate.service';

@Injectable()
export class RustPlusHandlerService implements OnModuleInit {
  mapSize;
  shopName = process.env.SHOP_NAME;
  // shopName = process.env.SHOP_NAME;
  sellOrders = [];
  currentCrates = [];
  cargoCrates = [];
  heliMarker;
  currentCH47 = [];
  teammates = [];
  oil_rig: IOilRig = {
    large: {
      crate: { exists: false, x: 0, y: 0, id: 0 },
      monument: { x: 0, y: 0 }
    },
    small: {
      crate: { exists: false, x: 0, y: 0, id: 0 },
      monument: { x: 0, y: 0 }
    }
  };
  cargoShip = {
    exists: false,
    x: 0,
    y: 0
  };
  heli = {
    exists: false
  };
  constructor(
    private rustPlusService: RustPlusService,
    private serversService: ServersService,
    private mapService: MapService,
    private schedulerRegistry: SchedulerRegistry,
    private translationService: TranslationService // private i18n: I18nContext, // @InjectBot() private readonly bot: Telegraf<Context>,
  ) {}

  async onModuleInit() {
    this.serversService.findAll().then((result) => {
      const server = result.find((server) => server.isSelected);
      console.log(`Initialization...`);
      this.rustPlusService.init(
        server.serverIp,
        server.appPort,
        process.env.PLAYER_ID,
        server.playerToken
      );
    });
  }

  @OnEvent('connected')
  async onConnected() {
    console.log('connected');
    await this.initMonuments();
    await this.initCargoOrHeli(5);
    await this.initCargoOrHeli(8);
    if (!this.schedulerRegistry.doesExist('cron', 'oil_rig'))
      await this.addCronJob('oil_rig');
  }

  async debug(message, options = {}) {
    const translation = await this.translationService.translate(
      'translation.' + message,
      {
        args: options
      }
    );
    console.log(translation);
    await this.rustPlusService.sendTeamMessage(translation);
  }

  /**
   * Get and save oil rigs coordinates, map Size
   */
  async initMonuments() {
    const map = await this.rustPlusService.sendRequestAsync({
      getMap: {}
    });
    this.mapSize = process.env.MAP_SIZE;
    const monuments = map.map.monuments.map((monument) => ({
      ...monument,
      location: this.mapService.getPos(monument.x, monument.y, this.mapSize)
    }));
    const small_oil = monuments.find(
      (monument) => monument.token === 'oil_rig_small'
    );
    const large_oil = monuments.find(
      (monument) => monument.token === 'large_oil_rig'
    );

    this.oil_rig.large.monument.x = large_oil.x;
    this.oil_rig.large.monument.y = large_oil.y;
    this.oil_rig.small.monument.x = small_oil.x;
    this.oil_rig.small.monument.y = small_oil.y;
  }

  /**
   * Check cargo and heli on start
   * @param type cargo_ship:5 || heli:8
   */
  async initCargoOrHeli(type) {
    const result = await this.rustPlusService.sendRequestAsync({
      getMapMarkers: {}
    });
    const event = result.mapMarkers.markers.find(
      (marker) => marker.type === type
    );

    let name;
    if (type === 5) {
      name = 'cargoShip';
    } else if (type === 8) {
      name = 'heli';
    }
    this[name].exists = !!event;
  }

  /**
   * Check oir rig crates
   * @param oil_rig_type large || small
   * @param mapMarkers map markers from rust+
   */
  async checkOilCrate(oil_rig_type, mapMarkers) {
    try {
      const crate_x = this.oil_rig[oil_rig_type].crate.x;
      const crate_y = this.oil_rig[oil_rig_type].crate.y;
      let marker;
      if (!crate_x) {
        //Координаты нефтевышки
        const x = this.oil_rig[oil_rig_type].monument.x;
        const y = this.oil_rig[oil_rig_type].monument.y;

        //Проверяем, находится ли Crate в радиусе нефтевышки
        marker = mapMarkers.mapMarkers.markers.find(
          (marker) =>
            marker.type === 6 &&
            marker.x - 30 < x &&
            marker.x + 30 > x &&
            marker.y - 30 < y &&
            marker.y + 30 > y
        );
        if (marker) {
          this.oil_rig[oil_rig_type].crate.x = marker.x;
          this.oil_rig[oil_rig_type].crate.y = marker.y;
          this.oil_rig[oil_rig_type].crate.exists = true;
          this.oil_rig[oil_rig_type].crate.id = marker.id;
        }
      } else {
        marker = mapMarkers.mapMarkers.markers.find(
          (marker) => marker.x === crate_x && marker.y === crate_y
        );
      }

      if (!marker && this.oil_rig[oil_rig_type].crate.exists) {
        this.oil_rig[oil_rig_type].crate.exists = false;
        await this.debug(oil_rig_type.toString().toUpperCase() + '_LOOTED');
        this.currentCrates = this.currentCrates.filter(
          (crate) => crate.id !== this.oil_rig[oil_rig_type].crate.id
        );
      }
      if (marker && !this.oil_rig[oil_rig_type].crate.exists) {
        this.oil_rig[oil_rig_type].crate.exists = true;
        await this.debug(oil_rig_type.toString().toUpperCase() + '_SPAWNED');
      }
    } catch (e) {
      console.log(e);
    }
  }

  /**
   * Проверка на новые ящики на карте
   * @param mapMarkers map markers from rust+
   */
  async checkCargoCrate(mapMarkers) {
    try {
      if (this.cargoShip.exists && this.cargoCrates.length < 4) {
        const x = this.cargoShip.x;
        const y = this.cargoShip.y;
        //Проверяем, находится ли Crate в радиусе Cargo
        const marker = mapMarkers.mapMarkers.markers.find((marker) => {
          return (
            marker.type === 6 &&
            marker.x - 50 < x &&
            marker.x + 50 > x &&
            marker.y - 50 < y &&
            marker.y + 50 > y &&
            marker.id !== this.cargoCrates[0]?.id &&
            marker.id !== this.cargoCrates[1]?.id &&
            marker.id !== this.cargoCrates[2]?.id
          );
        });
        if (marker) {
          this.cargoCrates.push(marker);
          let number;
          switch (this.cargoCrates.length) {
            case 1:
              number = '1st';
              break;
            case 2:
              number = '2nd';
              break;
            case 3:
              number = '3rd';
              break;
          }
          await this.debug('CARGO_CRATE_SPAWNED', { number });
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  /**
   * Cheking for new crates at monuments
   * @param mapMarkers map Markers
   */ async checkCH47Crate(mapMarkers) {
    try {
      const marker = mapMarkers.mapMarkers.markers.find((marker) => {
        let flag = true;
        for (const crate of this.currentCrates) {
          if (crate.id === marker.id) {
            flag = false;
          }
        }
        for (const crate of this.cargoCrates) {
          if (crate.id === marker.id) {
            flag = false;
          }
        }

        if (marker.id === this.oil_rig.small.crate.id) flag = false;
        if (marker.id === this.oil_rig.large.crate.id) flag = false;
        if (marker.type !== 6) flag = false;
        return flag;
      });
      if (marker) {
        const location = this.mapService.getGridPos(
          marker.x,
          marker.y,
          this.mapSize
        );
        //If location is null, crate is on oil rig and we do not need to notify about it again
        if (location) {
          this.currentCrates.push(marker);
          await this.debug(
            'LOCKED_CRATE_DROPPED',
            this.mapService.getPos(marker.x, marker.y, this.mapSize)
          );
        }
      }
      for (const crate of this.currentCrates) {
        const marker = mapMarkers.mapMarkers.markers.find(
          (marker) => marker.id === crate.id
        );
        if (!marker) {
          await this.debug(
            'LOCKED_CRATE_LOOTED',
            this.mapService.getPos(crate.x, crate.y, this.mapSize)
          );
          this.currentCrates = this.currentCrates.filter(
            (currentCrate) => crate.id !== currentCrate.id
          );
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  async checkCargo(result) {
    try {
      const marker = result.mapMarkers.markers.find(
        (marker) => marker.type === 5
      );

      if (!marker && this.cargoShip.exists) {
        this.cargoShip.exists = false;
        this.cargoCrates = [];
        await this.debug('CARGO_LEFT_MAP');
      } else if (marker) {
        if (!this.cargoShip.exists) {
          this.cargoShip.exists = true;
          await this.debug(
            'CARGO_SPAWNED',
            this.mapService.getPos(marker.x, marker.y, this.mapSize)
          );
        }
        this.cargoShip.x = marker.x;
        this.cargoShip.y = marker.y;
      }
    } catch (e) {
      console.log(e);
    }
  }

  async checkCH47(result) {
    try {
      const markers = result.mapMarkers.markers.filter(
        (marker) => marker.type === 4
      );

      for (const marker of markers) {
        const CH47 = this.currentCH47.find((ch) => ch.id === marker.id);
        if (!CH47) {
          this.currentCH47.push(marker);

          const large_x = this.oil_rig.large.crate.x;
          const large_y = this.oil_rig.large.crate.y;

          const small_x = this.oil_rig.small.crate.x;
          const small_y = this.oil_rig.small.crate.y;

          const current = new Date();
          const time =
            ('0' + current.getHours()).slice(-2) +
            ':' +
            ('0' + current.getMinutes()).slice(-2) +
            ':' +
            ('0' + current.getSeconds()).slice(-2);
          if (
            large_x > marker.x - 500 &&
            large_x < marker.x + 500 &&
            large_y > marker.y - 500 &&
            large_y < marker.y + 500
          ) {
            await this.debug('LARGE_ACTIVATED', { time });
            setTimeout(async () => await this.debug('LARGE_OPEN'), 900000);
          } else if (
            small_x > marker.x - 500 &&
            small_x < marker.x + 500 &&
            small_y > marker.y - 500 &&
            small_y < marker.y + 500
          ) {
            await this.debug('SMALL_ACTIVATED', { time });
            setTimeout(async () => await this.debug('SMALL_OPEN'), 900000);
          }
        }
      }

      this.currentCH47.forEach((ch) => {
        const CH47 = markers.find((marker) => marker.id === ch.id);
        if (!CH47) {
          this.currentCH47 = this.currentCH47.filter(
            (marker) => marker.id !== ch.id
          );
        }
      });
    } catch (e) {
      console.log(e);
    }
  }

  async checkTeammates() {
    const teamInfo = await this.rustPlusService.getTeamInfo();
    const players = teamInfo.teamInfo.members;
    if (!this.teammates) {
      this.teammates = players;
    } else {
      for (const player of players) {
        const dead_player = this.teammates.find((teammate) => {
          return (
            teammate.name === player.name && teammate.isAlive && !player.isAlive
          );
        });
        const offline_player = this.teammates.find((teammate) => {
          return (
            teammate.name === player.name &&
            teammate.isOnline &&
            !player.isOnline
          );
        });
        const online_player = this.teammates.find((teammate) => {
          return (
            teammate.name === player.name &&
            !teammate.isOnline &&
            player.isOnline
          );
        });
        if (dead_player) {
          await this.debug('PLAYER_DIED', {
            name: player.name,
            ...this.mapService.getPos(player.x, player.y, this.mapSize)
          });
        }
        if (online_player) {
          await this.debug('PLAYER_ONLINE', {
            name: player.name
          });
        }
        if (offline_player) {
          await this.debug('PLAYER_OFFLINE', {
            name: player.name,
            ...this.mapService.getPos(player.x, player.y, this.mapSize)
          });
        }
      }
      this.teammates = players;
    }
  }

  async checkHeli(result) {
    const marker = result.mapMarkers.markers.find(
      (marker) => marker.type === 8
    );
    if (marker) this.heliMarker = marker;

    if (!marker && this.heli.exists) {
      this.heli.exists = false;
      const explosion = result.mapMarkers.markers.find(
        (marker) => marker.type === 2
      );
      if (
        explosion &&
        explosion.x > this.heliMarker.x - 100 &&
        explosion.x < this.heliMarker.x + 100 &&
        explosion.y > this.heliMarker.y - 100 &&
        explosion.y < this.heliMarker.y + 100
      ) {
        await this.debug(
          'HELI_DESTROYED',
          this.mapService.getPos(explosion.x, explosion.y, this.mapSize)
        );
      } else {
        await this.debug('HELI_LEFT_MAP');
      }
    }
    if (marker && !this.heli.exists) {
      this.heli.exists = true;
      await this.debug(
        'HELI_SPAWNED',
        this.mapService.getPos(marker.x, marker.y, this.mapSize)
      );
    }
  }

  // async checkShop(mapMarkers) {
  //   const marker = mapMarkers.mapMarkers.markers.find(
  //     (marker) => marker.name === this.shopName,
  //   );
  //   if (marker) {
  //     console.log(marker);
  //     const items = marker.sellOrders;
  //     if (!this.sellOrders.length) {
  //       this.sellOrders = items.filter((item) => {
  //         return item.amountInStock > 0;
  //       });
  //     } else {
  //       for (const order of this.sellOrders) {
  //         const item = items.find(
  //           (item) =>
  //             item.itemId === order.itemId &&
  //             item.currencyId === order.currencyId,
  //         );
  //         if (item) {
  //           const difference = order.amountInStock - item.amountInStock;
  //           if (difference > 0) {
  //             const duplicate = items.find(
  //               (duplicate) => duplicate.itemId === item.itemId,
  //             );
  //             if (duplicate) {
  //               console.log('DUPLICATE');
  //             }
  //             await this.debug(
  //               difference +
  //                 ' ' +
  //                 itemList[order.itemId.toString()] +
  //                 ' was sold for ' +
  //                 order.costPerItem +
  //                 ' ' +
  //                 itemList[order.currencyId.toString()],
  //               false,
  //             );
  //           }
  //         }
  //       }
  //       this.sellOrders = items.filter((item) => {
  //         return item.amountInStock > 0;
  //       });
  //       // console.log(this.sellOrders);
  //     }
  //   }
  // }

  async addCronJob(name: string) {
    const job = new CronJob(`*/5 * * * * *`, () => {
      this.checkCrates();
    });
    this.schedulerRegistry.addCronJob(name, job);
    job.start();
  }

  async checkCrates() {
    const mapMarkers = await this.rustPlusService.sendRequestAsync({
      getMapMarkers: {}
    });
    await this.checkOilCrate('small', mapMarkers);
    await this.checkOilCrate('large', mapMarkers);
    await this.checkCargo(mapMarkers);
    await this.checkHeli(mapMarkers);
    await this.checkCH47(mapMarkers);
    await this.checkCargoCrate(mapMarkers);
    await this.checkTeammates();
    // await this.checkShop(mapMarkers);
    //let all cargo crates be pushed to an array (if they exist on app start)
    setTimeout(async () => await this.checkCH47Crate(mapMarkers), 20000);
  }

  @OnEvent('disconnected')
  onDisconnected() {
    if (!this.schedulerRegistry.doesExist('cron', 'oil_rig'))
      this.schedulerRegistry.deleteCronJob('oil_rig');
    console.log('disconnected');
  }

  @OnEvent('message')
  onMessage(message) {
    if (message.broadcast && message.broadcast.entityChanged) {
      const entityChanged = message.broadcast.entityChanged;

      const entityId = entityChanged.entityId;
      const value = entityChanged.payload.value;

      console.log(
        'entity ' + entityId + ' is now ' + (value ? 'active' : 'inactive')
      );
    }
  }

  @OnEvent('error')
  onError(error) {
    console.log('error: ' + error);
  }

  @OnEvent('request')
  onRequest(request) {
    console.log('request: ' + request);
  }

  @OnEvent('connecting')
  onConnecting() {
    console.log('connecting');
  }
}
