import { Elysia } from "elysia";
class Room {
  constructor(private options: Record<string, unknown>) { }
  getRooms() {
    return ["Room1", "Room2", "Room3"];
  }
}
// 插件
const roomApp = new Elysia()
  .decorate("room", new Room({/* some complex config */ }))
  .get("/", ({ room }) => {
    return room.getRooms(); // TypeScript error: Property 'room' does not exist
  })
  .as('global')

const app = new Elysia()
  // 插件
  .use(roomApp);