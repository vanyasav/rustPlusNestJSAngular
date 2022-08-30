import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as protobuf from 'protobufjs';
import * as WebSocket from 'ws';
import * as path from 'path';

@Injectable()
export class RustPlusService {
  private server: any;
  private port: any;
  private playerId: any;
  private playerToken: any;
  private useFacepunchProxy: boolean;
  private seq: number;
  private seqCallbacks: any[];
  private websocket: WebSocket;
  private AppRequest;
  private AppMessage;
  private _connectionState = false;
  /**
   *
   * Events emitted by the RustPlus class instance
   * - connecting: When we are connecting to the Rust Server.
   * - connected: When we are connected to the Rust Server.
   * - message: When an AppMessage has been received from the Rust Server.
   * - request: When an AppRequest has been sent to the Rust Server.
   * - disconnected: When we are disconnected from the Rust Server.
   * - error: When something goes wrong.
   * @param eventEmitter
   */
  constructor(private eventEmitter: EventEmitter2) {}

  public get connectionState() {
    return this._connectionState;
  }

  /**
   *
   * @param server RustServer ip
   * @param port Rust+ port
   * @param playerId steamID64
   * @param playerToken Rust+ player token
   * @param useFacepunchProxy Facepunch proxy
   */
  init(server, port, playerId, playerToken, useFacepunchProxy = false) {
    this.server = server;
    this.port = port;
    this.playerId = playerId;
    this.playerToken = playerToken;
    this.useFacepunchProxy = useFacepunchProxy;

    this.seq = 0;
    this.seqCallbacks = [];

    this.connect();
  }
  /**
   * This sets everything up and then connects to the Rust Server via WebSocket.
   */
  connect() {
    // load protobuf then connect
    protobuf.load(path.resolve(__dirname, 'rustplus.proto')).then((root) => {
      // make sure existing connection is disconnected before connecting again.
      if (this.websocket) {
        this.disconnect();
      }

      // load proto types
      this.AppRequest = root.lookupType('rustplus.AppRequest');
      this.AppMessage = root.lookupType('rustplus.AppMessage');

      // fire event as we are connecting
      this.eventEmitter.emit('connecting');

      // connect to websocket
      const address = this.useFacepunchProxy
        ? `wss://companion-rust.facepunch.com/game/${this.server}/${this.port}`
        : `ws://${this.server}:${this.port}`;
      this.websocket = new WebSocket(address);

      // fire event when connected
      this.websocket.on('open', () => {
        this.eventEmitter.emit('connected');
        this._connectionState = true;
      });

      // fire event for websocket errors
      this.websocket.on('error', (e) => {
        this.eventEmitter.emit('error', e);
      });

      this.websocket.on('message', (data) => {
        // decode received message
        const message = this.AppMessage.decode(data);

        // check if received message is a response and if we have a callback registered for it
        if (
          message.response &&
          message.response.seq &&
          this.seqCallbacks[message.response.seq]
        ) {
          // get the callback for the response sequence
          const callback = this.seqCallbacks[message.response.seq];

          // call the callback with the response message
          const result = callback(message);

          // remove the callback
          delete this.seqCallbacks[message.response.seq];

          // if callback returns true, don't fire message event
          if (result) {
            return;
          }
        }

        // fire message event for received messages that aren't handled by callback
        this.eventEmitter.emit('message', this.AppMessage.decode(data));
      });

      // fire event when disconnected
      this.websocket.on('close', () => {
        this.eventEmitter.emit('disconnected');
        this._connectionState = false;
      });
    });
  }

  /**
   * Disconnect from the Rust Server.
   */
  disconnect() {
    if (this.websocket) {
      this.websocket.terminate();
      this.websocket = null;
    }
  }

  /**
   * Send a Request to the Rust Server with an optional callback when a Response is received.
   * @param data this should contain valid data for the AppRequest packet in the rustplus.proto schema file
   * @param callback
   */
  sendRequest(data, callback) {
    // increment sequence number
    const currentSeq = ++this.seq;

    // save callback if provided
    if (callback) {
      this.seqCallbacks[currentSeq] = callback;
    }

    // create protobuf from AppRequest packet
    const request = this.AppRequest.fromObject({
      seq: currentSeq,
      playerId: this.playerId,
      playerToken: this.playerToken,
      ...data, // merge in provided data for AppRequest
    });

    // send AppRequest packet to rust server
    this.websocket.send(this.AppRequest.encode(request).finish());

    // fire event when request has been sent, this is useful for logging
    this.eventEmitter.emit('request: ', request);
  }

  /**
   * Send a Request to the Rust Server and return a Promise
   * @param data this should contain valid data for the AppRequest packet defined in the rustplus.proto schema file
   * @param timeoutMilliseconds milliseconds before the promise will be rejected. Defaults to 10 seconds.
   */
  sendRequestAsync(data, timeoutMilliseconds = 10000): Promise<any> {
    return new Promise((resolve, reject) => {
      // reject promise after timeout
      const timeout = setTimeout(() => {
        reject(new Error('Timeout reached while waiting for response'));
      }, timeoutMilliseconds);

      // send request
      this.sendRequest(data, (message) => {
        // cancel timeout
        clearTimeout(timeout);

        if (message.response.error) {
          // reject promise if server returns an AppError for this request
          reject(message.response.error);
        } else {
          // request was successful, resolve with message.response
          resolve(message.response);
        }
      });
    });
  }

  /**
   *
   * @param id smart switch id
   */
  async turnSmartSwitchOn(id: number) {
    return await this.sendRequestAsync({
      entityId: id,
      setEntityValue: {
        value: true,
      },
    });
  }

  /**
   *
   * @param id smart switch id
   */
  async turnSmartSwitchOff(id: number) {
    return await this.sendRequestAsync({
      entityId: id,
      setEntityValue: {
        value: false,
      },
    });
  }

  /**
   *
   * @param message message for team chat
   */
  async sendTeamMessage(message: string) {
    return this.sendRequestAsync({
      sendTeamMessage: {
        message: message,
      },
    });
  }

  /**
   *
   * get team chat messages
   */
  async getTeamChat() {
    return this.sendRequestAsync({
      getTeamChat: {},
    });
  }

  /**
   * - Returns entity info
   * @param id entity id
   */
  async getEntityInfo(id: number) {
    return await this.sendRequestAsync({
      entityId: id,
      getEntityInfo: {},
    });
  }
  /**
   * Returns positions:
   * - Crates
   * - Heli
   * - Bradley
   * - CH47
   */
  async getMapMarkers() {
    const result = await this.sendRequestAsync({
      getMapMarkers: {},
    });
    //Filter and return everything without vendingMachines
    //Change condition in case of probable errors
    return result['mapMarkers'].markers.filter(
      (marker) => !marker.sellOrders.length,
    );
  }

  async getAllMarkers() {
    const result = await this.sendRequestAsync({
      getMapMarkers: {},
    });
    //Filter and return everything without vendingMachines
    //Change condition in case of probable errors
    return result['mapMarkers'].markers.filter(
      (marker) => marker.name === '=RX=ON TOP! Fuck Offliners!',
    );
  }

  async getMap() {
    const map = await this.sendRequestAsync({
      getMap: {},
    });
    return map;
    // return map.map.monuments.map((monument) => ({
    //   ...monument,
    //   location: this.mapService.getGridPos(monument.x, monument.y, 4000),
    // }));
  }

  // async onModuleInit() {
  //   console.log(`Initialization...`);
  //   this.init(
  //     process.env.SERVER_IP,
  //     process.env.APP_PORT,
  //     process.env.PLAYER_ID,
  //     process.env.PLAYER_TOKEN,
  //   );
  // }
}
