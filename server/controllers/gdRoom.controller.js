import GdRoom from "../models/gdRoom.model.js";
import GdParticipant from "../models/gdParticipant.model.js";

// 1. Create a new Discussion Room
export const createGdRoom = async (req, res) => {
  try {
    const {
      topic,
      description,
      category,
      maxParticipants,
      language,
      difficulty,
      duration,
      roomType,
      password,
      settings
    } = req.body;

    const newRoom = await GdRoom.create({
      topic,
      description,
      category,
      maxParticipants,
      language,
      difficulty,
      duration,
      roomType,
      password,
      settings,
      host: req.userId
    });

    // Add host as the first participant
    await GdParticipant.create({
      user: req.userId,
      room: newRoom._id,
      role: "Host"
    });

    // Update room participants array
    const hostParticipant = await GdParticipant.findOne({ user: req.userId, room: newRoom._id });
    newRoom.participants.push(hostParticipant._id);
    await newRoom.save();

    return res.status(201).json({ success: true, room: newRoom });
  } catch (error) {
    console.error("Error creating GD Room:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 2. Get All Rooms (Lobby)
export const getGdRooms = async (req, res) => {
  try {
    const { type, difficulty, status } = req.query;
    
    let filter = {};
    if (type) filter.roomType = type;
    if (difficulty) filter.difficulty = difficulty;
    if (status) filter.status = status;
    else filter.status = { $in: ["waiting", "active"] }; // default to active/waiting rooms

    // For public listing, exclude password protected ones unless specifically asked
    if (!type || type !== "Password Protected") {
        filter.roomType = { $ne: "Password Protected" };
    }

    const rooms = await GdRoom.find(filter)
      .populate("host", "name avatar")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({ success: true, rooms });
  } catch (error) {
    console.error("Error fetching GD Rooms:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 3. Get Room Details (Waiting Room)
export const getGdRoomById = async (req, res) => {
  try {
    const room = await GdRoom.findById(req.params.id)
      .populate("host", "name avatar")
      .populate({
        path: "participants",
        populate: {
          path: "user",
          select: "name avatar"
        }
      });

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    return res.status(200).json({ success: true, room });
  } catch (error) {
    console.error("Error fetching GD Room details:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 4. Join a Room
export const joinGdRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const room = await GdRoom.findById(id).populate("participants");
    
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    if (room.status === "completed") {
      return res.status(400).json({ success: false, message: "Room is already completed" });
    }

    if (room.roomType === "Password Protected" && room.password !== password) {
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }

    if (room.participants.length >= room.maxParticipants) {
      return res.status(400).json({ success: false, message: "Room is full" });
    }

    // Check if user is already a participant
    const existingParticipant = await GdParticipant.findOne({ user: req.userId, room: id });
    if (existingParticipant) {
      return res.status(200).json({ success: true, message: "Already in room", room });
    }

    const participant = await GdParticipant.create({
      user: req.userId,
      room: id,
      role: "Participant"
    });

    room.participants.push(participant._id);
    await room.save();

    return res.status(200).json({ success: true, message: "Joined successfully", room });
  } catch (error) {
    console.error("Error joining GD Room:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 5. Leave a Room
export const leaveGdRoom = async (req, res) => {
  try {
    const { id } = req.params;
    
    const participant = await GdParticipant.findOneAndUpdate(
      { user: req.userId, room: id },
      { leftAt: new Date(), isActive: false },
      { new: true }
    );

    if (!participant) {
      return res.status(404).json({ success: false, message: "Participant not found in room" });
    }

    return res.status(200).json({ success: true, message: "Left room successfully" });
  } catch (error) {
    console.error("Error leaving GD Room:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
