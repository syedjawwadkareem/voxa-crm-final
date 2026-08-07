'use client';

import React, { useState, useEffect } from 'react';
import { PhoneOutgoing, PhoneIncoming, PhoneMissed, Clock, Loader2 } from 'lucide-react';

interface CallRecord {
  id: number;
  extension: string;
  callerid: string;
  destination: string;
  context: string;
  start_time: string;
  answer_time: string;
}

export function CallLogs() {
  const [logs, setLogs] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function fetchLogs() {
      try {
        setLoading(true);
        // 1. Get Auth Token
        const authRes = await fetch('http://172.16.17.127/api/api.php?action=GenerateAuthKey&user=apiUAsk&pass=7xK9pQ2mW5vB');
        if (!authRes.ok) throw new Error('Failed to fetch auth key');
        const authData = await authRes.json();

        if (authData.status !== 'success') {
          throw new Error(authData.message || 'Authentication failed');
        }

        const token = authData.data.token;

        // 2. Fetch Recent Calls
        const logsRes = await fetch('http://172.16.17.127/api/api.php?action=GetRecentCalls', {
          headers: {
            'X-Auth-Token': token
          }
        });

        if (!logsRes.ok) throw new Error('Failed to fetch call logs');
        const logsData = await logsRes.json();

        if (logsData.status !== 'success') {
          throw new Error('Failed to parse call logs');
        }

        if (isMounted) {
          setLogs(logsData.data.recent_calls || []);
          setError('');
        }
      } catch (err: any) {
        if (isMounted) {
          console.error(err);
          // For demo purposes if API fails, we could show an error or mock data
          setError('Failed to connect to telephony server. Please check your network connection to 172.16.17.127.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchLogs();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-slate-100/50">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );
  }

  return (
    <div className="w-full h-full max-h-[650px] bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-slate-100/50 flex flex-col">
      <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
        <Clock size={20} className="text-teal-600" />
        Recent Call Logs
      </h3>

      {error ? (
        <div className="flex-1 flex items-center justify-center text-center px-4">
          <p className="text-sm text-red-500 font-medium bg-red-50 p-4 rounded-xl border border-red-100">{error}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500 text-sm">No recent calls found.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          {logs.map((log) => {
            // Determine call type based on context or answer time roughly
            const isMissed = log.answer_time === '0000-00-00 00:00:00';
            const isOutgoing = log.context.includes('outgoing');

            return (
              <div key={log.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isMissed ? 'bg-red-50 text-red-500' : isOutgoing ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'}`}>
                    {isMissed ? <PhoneMissed size={16} /> : isOutgoing ? <PhoneOutgoing size={16} /> : <PhoneIncoming size={16} />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      {isOutgoing ? log.destination : log.callerid}
                    </div>
                    <div className="text-xs font-medium text-slate-400 mt-0.5">
                      Ext: {log.extension}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-slate-500">
                    {new Date(log.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase">
                    {isMissed ? 'Missed' : isOutgoing ? 'Outgoing' : 'Incoming'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
