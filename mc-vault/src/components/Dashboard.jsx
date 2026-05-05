import React from 'react';
import ColorConverter from './ColorConverter';
import ServerStatus from './ServerStatus';
import SkinViewer from './SkinViewer';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white p-12">
      <h1 className="text-4xl font-bold mb-8 uppercase tracking-widest text-emerald-400">MC-Vault</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <ServerStatus />
          <SkinViewer />
        </div>
        <ColorConverter />
      </div>
    </div>
  );
};

export default Dashboard;
