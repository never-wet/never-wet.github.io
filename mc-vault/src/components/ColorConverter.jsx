import React, { useState } from 'react';

const ColorConverter = () => {
  const [input, setInput] = useState('');

  const convertMinecraftColors = (text) => {
    const colors = {
      '0': '#000000', '1': '#0000AA', '2': '#00AA00', '3': '#00AAAA',
      '4': '#AA0000', '5': '#AA00AA', '6': '#FFAA00', '7': '#AAAAAA',
      '8': '#555555', '9': '#5555FF', 'a': '#55FF55', 'b': '#55FFFF',
      'c': '#FF5555', 'd': '#FF55FF', 'e': '#FFFF55', 'f': '#FFFFFF'
    };

    let parts = text.split(/§|&/);
    return parts.map((part, index) => {
      if (index === 0) return <span key={index}>{part}</span>;
      const colorCode = part[0];
      const content = part.substring(1);
      return (
        <span key={index} style={{ color: colors[colorCode] || 'inherit' }}>
          {content}
        </span>
      );
    });
  };

  return (
    <div className="mc-card p-8">
      <h3 className="text-2xl font-bold mb-6 text-emerald-300 uppercase">Color Converter</h3>
      <input 
        className="mc-input w-full mb-6"
        placeholder="Enter text with &a or §a codes"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className="p-6 border-4 border-black bg-black min-h-[100px] font-mono text-2xl">
        {convertMinecraftColors(input)}
      </div>
    </div>
  );
};

export default ColorConverter;
