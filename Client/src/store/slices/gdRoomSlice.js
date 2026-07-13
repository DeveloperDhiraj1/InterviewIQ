import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentRoom: null,
  participants: [],
  transcripts: [],
  activeSpeakerId: null,
  isAudioMuted: false,
  isVideoMuted: false,
  status: 'idle', // 'idle', 'connecting', 'connected', 'error'
  error: null
};

const gdRoomSlice = createSlice({
  name: 'gdRoom',
  initialState,
  reducers: {
    setRoom: (state, action) => {
      state.currentRoom = action.payload;
    },
    setParticipants: (state, action) => {
      state.participants = action.payload;
    },
    addParticipant: (state, action) => {
      const exists = state.participants.find(p => p.user._id === action.payload.user._id);
      if (!exists) {
        state.participants.push(action.payload);
      }
    },
    removeParticipant: (state, action) => {
      state.participants = state.participants.filter(p => p.user._id !== action.payload);
    },
    addTranscript: (state, action) => {
      state.transcripts.push(action.payload);
    },
    setActiveSpeaker: (state, action) => {
      state.activeSpeakerId = action.payload;
    },
    toggleAudio: (state) => {
      state.isAudioMuted = !state.isAudioMuted;
    },
    toggleVideo: (state) => {
      state.isVideoMuted = !state.isVideoMuted;
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearRoom: (state) => {
      return initialState;
    }
  }
});

export const {
  setRoom,
  setParticipants,
  addParticipant,
  removeParticipant,
  addTranscript,
  setActiveSpeaker,
  toggleAudio,
  toggleVideo,
  setStatus,
  setError,
  clearRoom
} = gdRoomSlice.actions;

export default gdRoomSlice.reducer;
