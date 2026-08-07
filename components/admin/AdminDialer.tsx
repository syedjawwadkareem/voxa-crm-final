import React, { useState } from 'react';
import { Phone, Delete, UserPlus, Mic, MicOff, PhoneOff, Volume2, Pause, Play, ArrowRightLeft, ShieldAlert } from 'lucide-react';

export function AdminDialer() {
  const [number, setNumber] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);

  const handleKeyPress = (digit: string) => {
    if (number.length < 15) {
      setNumber((prev) => prev + digit);
    }
  };

  const handleDelete = () => {
    setNumber((prev) => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (number) {
      setIsCalling(true);
    }
  };

  const handleHangup = () => {
    setIsCalling(false);
    setNumber('');
    setIsOnHold(false);
  };

  const keys = [
    { digit: '1', letters: '' },
    { digit: '2', letters: 'ABC' },
    { digit: '3', letters: 'DEF' },
    { digit: '4', letters: 'GHI' },
    { digit: '5', letters: 'JKL' },
    { digit: '6', letters: 'MNO' },
    { digit: '7', letters: 'PQRS' },
    { digit: '8', letters: 'TUV' },
    { digit: '9', letters: 'WXYZ' },
    { digit: '*', letters: '' },
    { digit: '0', letters: '+' },
    { digit: '#', letters: '' },
  ];

  return (
    <div className="w-full mx-auto bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-slate-100/50">
      <div className="flex flex-col items-center">
        {/* Header / Display */}
        <div className="w-full mb-6">
          <div className="h-16 flex items-center justify-center relative bg-slate-50/50 rounded-2xl border border-slate-100">
            <span className={`text-3xl tracking-wider font-semibold ${number ? 'text-slate-800' : 'text-slate-300'}`}>
              {number || 'Enter Number'}
            </span>
            {number && !isCalling && (
              <button 
                onClick={handleDelete}
                className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-200/50 rounded-full"
              >
                <Delete size={20} />
              </button>
            )}
          </div>
          <div className={`text-center mt-3 h-5 text-sm font-medium ${isCalling ? (isOnHold ? 'text-amber-600' : 'text-teal-600 animate-pulse') : 'text-transparent'}`}>
            {isCalling ? (isOnHold ? 'On Hold' : 'Calling... 00:00') : 'Ready'}
          </div>
        </div>

        {/* Keypad */}
        {!isCalling && (
          <div className="grid grid-cols-3 gap-4 w-full max-w-[260px] mb-8">
            {keys.map((key, i) => (
              <button
                key={i}
                onClick={() => handleKeyPress(key.digit)}
                className="group flex flex-col items-center justify-center w-16 h-16 mx-auto rounded-full bg-slate-50/50 hover:bg-teal-50 hover:shadow-md transition-all duration-200 border border-slate-100 hover:border-teal-100"
              >
                <span className="text-2xl font-medium text-slate-700 group-hover:text-teal-700">{key.digit}</span>
                {key.letters && (
                  <span className="text-[10px] font-semibold text-slate-400 group-hover:text-teal-500 uppercase tracking-widest mt-[-2px]">
                    {key.letters}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Call Controls (Always visible, but styles change when active) */}
        <div className="flex flex-col items-center justify-center w-full max-w-[280px]">
          <div className="grid grid-cols-3 gap-4 w-full mb-6">
            <button
              disabled={!isCalling}
              onClick={() => setIsMuted(!isMuted)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 ${!isCalling ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400' : isMuted ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              {isMuted ? <MicOff size={22} className="mb-1" /> : <Mic size={22} className="mb-1" />}
              <span className="text-xs font-medium">Mute</span>
            </button>
            
            <button
              disabled={!isCalling}
              onClick={() => setIsOnHold(!isOnHold)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 ${!isCalling ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400' : isOnHold ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              {isOnHold ? <Play size={22} className="mb-1" /> : <Pause size={22} className="mb-1" />}
              <span className="text-xs font-medium">Hold</span>
            </button>

            <button disabled={!isCalling} className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 ${!isCalling ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
              <ArrowRightLeft size={22} className="mb-1" />
              <span className="text-xs font-medium">Transfer</span>
            </button>

            <button disabled={!isCalling} className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 ${!isCalling ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
              <UserPlus size={22} className="mb-1" />
              <span className="text-xs font-medium">Add</span>
            </button>

            <button disabled={!isCalling} className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 ${!isCalling ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
              <ShieldAlert size={22} className="mb-1" />
              <span className="text-xs font-medium text-center leading-tight">Supervisor</span>
            </button>

            <button disabled={!isCalling} className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 ${!isCalling ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
              <Volume2 size={22} className="mb-1" />
              <span className="text-xs font-medium">Volume</span>
            </button>
          </div>

          {/* Main Action Button */}
          {isCalling ? (
            <button
              onClick={handleHangup}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-medium shadow-lg shadow-red-500/30 transition-all duration-200 hover:scale-[1.02]"
            >
              <PhoneOff size={20} />
              End Call
            </button>
          ) : (
            <button
              onClick={handleCall}
              disabled={!number}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 hover:from-teal-600 hover:to-emerald-500 text-white font-medium shadow-lg shadow-teal-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
            >
              <Phone size={20} fill="currentColor" />
              Call
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
