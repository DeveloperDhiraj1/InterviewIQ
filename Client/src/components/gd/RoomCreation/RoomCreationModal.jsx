import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Mic, Video, Users, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RoomCreationModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    topic: '',
    category: 'Tech',
    maxParticipants: 6,
    language: 'English',
    difficulty: 'Medium',
    duration: 20,
    roomType: 'Public',
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API call to create room, then navigate
    const simulatedRoomId = Math.random().toString(36).substring(7);
    navigate(`/gd/room/${simulatedRoomId}`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-900/50">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              Create Discussion Room
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-5">
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Discussion Topic</label>
                <input 
                  type="text" 
                  required
                  placeholder="E.g., Impact of AI on Job Markets"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  value={formData.topic}
                  onChange={e => setFormData({...formData, topic: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Difficulty</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                    value={formData.difficulty}
                    onChange={e => setFormData({...formData, difficulty: e.target.value})}
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Language</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                    value={formData.language}
                    onChange={e => setFormData({...formData, language: e.target.value})}
                  >
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Hinglish</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Duration (Minutes)</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                    value={formData.duration}
                    onChange={e => setFormData({...formData, duration: Number(e.target.value)})}
                  >
                    <option value={10}>10 Minutes</option>
                    <option value={20}>20 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Room Type</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                    value={formData.roomType}
                    onChange={e => setFormData({...formData, roomType: e.target.value})}
                  >
                    <option>Public</option>
                    <option>Private</option>
                    <option>AI Practice</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-10 h-6 bg-indigo-600 rounded-full flex items-center p-1 transition-colors">
                    <div className="w-4 h-4 bg-white rounded-full shadow-md transform translate-x-4 transition-transform" />
                  </div>
                  <span className="text-sm text-slate-300 group-hover:text-slate-100 flex items-center gap-2"><Video className="w-4 h-4"/> Video Enabled</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-10 h-6 bg-indigo-600 rounded-full flex items-center p-1 transition-colors">
                    <div className="w-4 h-4 bg-white rounded-full shadow-md transform translate-x-4 transition-transform" />
                  </div>
                  <span className="text-sm text-slate-300 group-hover:text-slate-100 flex items-center gap-2"><Mic className="w-4 h-4"/> Audio Enabled</span>
                </label>
              </div>

            </div>

            {/* Footer */}
            <div className="mt-8 flex justify-end gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20"
              >
                Launch Room
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RoomCreationModal;
