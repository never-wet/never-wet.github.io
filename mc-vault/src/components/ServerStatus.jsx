import React, { useState } from 'react';

const ServerStatus = () => {
  const [host, setHost] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const pingServer = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/ping?host=${host}`);
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mc-card p-8">
      <h3 className="text-2xl font-bold mb-6 text-emerald-300 uppercase">Server Status</h3>
      <input 
        className="mc-input w-full mb-4"
        placeholder="e.g. mc.hypixel.net"
        value={host}
        onChange={(e) => setHost(e.target.value)}
      />
      <button 
        onClick={pingServer}
        className="mc-btn w-full"
      >
        {loading ? 'Pinging...' : 'Ping Server'}
      </button>
      {status && status.data && (
        <div className="mt-6 p-4 border-2 border-black bg-black font-mono text-sm">
          <p>Players: {status.data.players}/{status.data.maxPlayers}</p>
          <p>MOTD: {status.data.motd}</p>
        </div>
      )}
    </div>
  );
};

export default ServerStatus;
