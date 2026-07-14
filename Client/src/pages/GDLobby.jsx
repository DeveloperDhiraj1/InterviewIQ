import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, PlusCircle, Search, PlayCircle, Globe, Crown, Flame, Zap, Leaf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RoomCreationModal from '../components/gd/RoomCreation/RoomCreationModal';

const dummyRooms = [
  { id: 1, topic: 'Should AI replace Software Engineers?', host: 'Alex', participants: 4, max: 6, difficulty: 'Hard', language: 'English' },
  { id: 2, topic: 'Impact of 5G on Global Economy', host: 'Sarah', participants: 2, max: 8, difficulty: 'Medium', language: 'English' },
  { id: 3, topic: 'Is Work From Home the future?', host: 'Vikram', participants: 5, max: 10, difficulty: 'Easy', language: 'Hindi' },
];

const difficultyConfig = {
  Hard:   { cls: 'bg-red-500/20 text-red-400',     icon: <Flame className="w-3 h-3" /> },
  Medium: { cls: 'bg-amber-500/20 text-amber-400', icon: <Zap className="w-3 h-3" /> },
  Easy:   { cls: 'bg-emerald-500/20 text-emerald-400', icon: <Leaf className="w-3 h-3" /> },
};

const GDLobby = () => {
  const [rooms] = useState(dummyRooms);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  const filtered = rooms.filter(r =>
    r.topic.toLowerCase().includes(search.toLowerCase()) ||
    r.host.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden">
      {/* Background gradients — clipped so they don't cause horizontal scroll */}
      <div className="absolute top-0 left-0 w-72 h-72 sm:w-96 sm:h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-72 h-72 sm:w-[30rem] sm:h-[30rem] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 relative z-10">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 sm:mb-12"
        >
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
                Discussion Hub
              </h1>
              <p className="text-slate-400 mt-1 text-sm sm:text-base">
                Join live group discussions or practice with AI.
              </p>
            </div>

            {/* Create Room — full width on mobile, auto on desktop */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-indigo-600 active:bg-indigo-700 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] w-full sm:w-auto min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              Create Room
            </button>
          </div>

          {/* Search bar — always full width */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search topics or hosts…"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700/50 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors backdrop-blur-sm"
            />
          </div>
        </motion.div>

        {/* ── Room Grid ───────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <p className="text-lg">No rooms found.</p>
            <button onClick={() => setIsCreateModalOpen(true)} className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm underline-offset-2 underline">
              Create the first one
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filtered.map((room, index) => {
              const diff = difficultyConfig[room.difficulty] ?? difficultyConfig.Easy;
              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.08 }}
                  className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between hover:border-indigo-500/40 transition-all group relative overflow-hidden active:scale-[0.98]"
                >
                  {/* Left accent stripe */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-indigo-500 transition-colors rounded-l-2xl" />

                  <div>
                    {/* Badges row */}
                    <div className="flex justify-between items-center mb-3 gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 text-xs font-semibold rounded-lg text-slate-300 shrink-0">
                        <Globe className="w-3 h-3" /> {room.language}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg shrink-0 ${diff.cls}`}>
                        {diff.icon} {room.difficulty}
                      </span>
                    </div>

                    {/* Topic */}
                    <h3 className="text-base sm:text-lg font-bold text-slate-100 leading-snug line-clamp-2 mb-3">
                      {room.topic}
                    </h3>

                    {/* Host */}
                    <div className="flex items-center gap-1.5 text-sm text-slate-400">
                      <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Host: <span className="text-slate-300 font-medium">{room.host}</span></span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-5 flex justify-between items-center pt-4 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="text-sm font-medium">{room.participants}/{room.max}</span>
                    </div>
                    <button
                      onClick={() => navigate(`/gd/room/${room.id}`)}
                      className="inline-flex items-center gap-1.5 bg-slate-800 group-hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors min-h-[44px] min-w-[44px]"
                    >
                      Join <PlayCircle className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <RoomCreationModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  );
};

export default GDLobby;
