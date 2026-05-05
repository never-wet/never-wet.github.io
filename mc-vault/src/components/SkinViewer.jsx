import React, { useEffect, useRef, useState } from 'react';
import * as skinview3d from 'skinview3d';

const SkinViewer = () => {
  const canvasRef = useRef(null);
  const [username, setUsername] = useState('Steve');

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const skinViewer = new skinview3d.SkinViewer({
      canvas: canvasRef.current,
      width: 300,
      height: 300,
      skin: `https://mc-heads.net/skin/${username}`,
    });

    skinViewer.autoRotate = true;

    return () => skinViewer.dispose();
  }, [username]);

  return (
    <div className="p-6 border border-white/20 rounded-lg bg-gray-900">
      <h3 className="text-xl font-bold mb-4">Skin Viewer</h3>
      <input 
        className="w-full p-2 mb-4 bg-black border border-gray-700 text-white rounded"
        placeholder="Enter Minecraft username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <canvas ref={canvasRef} className="mx-auto" />
    </div>
  );
};

export default SkinViewer;
