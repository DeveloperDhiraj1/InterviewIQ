import express from "express";
import {
  createGdRoom,
  getGdRooms,
  getGdRoomById,
  joinGdRoom,
  leaveGdRoom
} from "../controllers/gdRoom.controller.js";
import isauth from "../middlewares/isauth.js";

const gdRoomRouter = express.Router();

gdRoomRouter.use(isauth);

gdRoomRouter.post("/", createGdRoom);
gdRoomRouter.get("/", getGdRooms);
gdRoomRouter.get("/:id", getGdRoomById);
gdRoomRouter.post("/:id/join", joinGdRoom);
gdRoomRouter.post("/:id/leave", leaveGdRoom);

export default gdRoomRouter;
