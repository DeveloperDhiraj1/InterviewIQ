import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, PlusCircle, Search, PlayCircle, Shield, Globe, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RoomCreationModal from '../components/gd/RoomCreation/RoomCreationModal';

const dummyRooms = [
  { id: 1, topic: 'Should AI replace Software Engineers?', host: 'Alex', participants: 4, max: 6, difficulty: 'Hard', language: 'English' },
  { id: 2, topic: 'Impact of 5G on Global Economy', host: 'Sarah', participants: 2, max: 8, difficulty: 'Medium', language: 'English' },
  { id: 3, topic: 'Is Work From Home the future?', host: 'Vikram', participants: 5, max: 10, difficulty: 'Easy', language: 'Hindi' },
];

const GDLobby = () => {
  const [rooms, setRooms] = useState(dummyRooms);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleJoinRoom = (roomId) => {
    navigate(`/gd/room/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Discussion Hub
            </h1>
            <p className="text-slate-400 mt-2">Join live group discussions or practice with AI.</p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search topics..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors backdrop-blur-sm"
              />
            </div>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-[0_0_15px_rgba(79,70,229,0.5)] whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Room</span>
            </button>
          </div>
        </motion.div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-md flex flex-col justify-between hover:border-indigo-500/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/0 group-hover:bg-indigo-500/100 transition-all" />
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2 py-1 bg-slate-800 text-xs font-semibold rounded-md text-slate-300 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> {room.language}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-md ${
                    room.difficulty === 'Hard' ? 'bg-red-500/20 text-red-400' : 
                    room.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {room.difficulty}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-100 mb-2 leading-tight">
                  {room.topic}
                </h3>
                
                <div className="flex items-center gap-2 text-sm text-slate-400 mt-4">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>Host: <span className="text-slate-300 font-medium">{room.host}</span></span>
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center pt-4 border-t border-slate-800/50">
                <div className="flex items-center gap-2 text-slate-300">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-medium">{room.participants} / {room.max}</span>
                </div>
                <button 
                  onClick={() => handleJoinRoom(room.id)}
                  className="bg-slate-800 hover:bg-indigo-600 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 group-hover:bg-indigo-600"
                >
                  Join <PlayCircle className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <RoomCreationModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
};

export default GDLobby;
