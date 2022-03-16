import http from "http";

import WebSocket from "ws";

import { Server } from "..";
import { Client } from "../app/ents";
import { Room } from "../app/room";

import { Network } from "./network";
import { ClientFilter, defaultFilter } from "./shared";

type RoomsParams = {
  maxClients: number;
  pingInterval: number;
  updateInterval: number;
  padding: number;
  chunkSize: number;
  dimension: number;
  maxHeight: number;
  maxLightLevel: number;
  maxChunksPerTick: number;
};

class Rooms extends Map<string, Room> {
  constructor(public server: Server, public params: RoomsParams) {
    super();

    const { network } = this.server;

    network.wss.on(
      "connection",
      (client: WebSocket, req: http.IncomingMessage) => {
        const roomId = new URLSearchParams(req.url.split("?")[1]).get("room");
        const room = this.get(roomId);

        if (!room) {
          console.warn("Room not found.");
          return;
        }

        room.onConnect(client);
      }
    );

    network.app.get("/has-room", (req, res) => {
      res.json(this.has(req.query.room as string));
    });

    network.app.get("/rooms", (_, res) => {
      const rooms = [];
      const fields = ["id", "name", "position", "direction", "currentChunk"];
      this.forEach((room) => {
        rooms.push({
          name: room.name,
          clients: Array.from(room.clients.values()).map((client) => {
            const print = {};
            fields.forEach((f) => {
              print[f] = client[f];
            });
            return print;
          }),
        });
      });

      res.header("Content-Type", "application/json");
      res.send(JSON.stringify(rooms, null, 4));
    });
  }

  createRoom = (name: string) => {
    const room = new Room({
      name,
      ...this.params,
    });

    this.set(name, room);

    return room;
  };

  findClient = (id: string) => {
    for (const [, room] of Array.from(this)) {
      const client = room.clients.get(id);
      if (client) return client;
    }
    return null;
  };

  broadcast = (event: any, filter: ClientFilter = defaultFilter) => {
    const encoded = Network.encode(event);

    this.filterClients(filter, (client) => {
      client.send(encoded);
    });
  };

  private filterClients = (
    { roomId, exclude, include }: ClientFilter,
    func: (client: Client) => void
  ) => {
    include = include || [];
    exclude = exclude || [];

    const pass = (client: Client) => {
      if (include.length !== 0) {
        return include.includes(client.id);
      } else if (exclude.length !== 0) {
        return !exclude.includes(client.id);
      } else {
        return true;
      }
    };

    if (roomId) {
      const room = this.get(roomId);
      if (!room) return [];

      room.clients.forEach((client) => {
        if (pass(client)) func(client);
      });
    } else {
      this.forEach((room) =>
        room.clients.forEach((client) => {
          if (pass(client)) func(client);
        })
      );
    }
  };
}

export { Rooms };
