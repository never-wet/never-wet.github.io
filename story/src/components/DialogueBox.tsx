import React, { useState, useEffect } from 'react';
import { Node } from '../engine/types';

interface Props {
  node: Node;
  onFinish?: () => void;
}

export const Typewriter: React.FC<{ text: string, speed?: number }> = ({ text, speed = 30 }) => {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return <p>{displayed}</p>;
};

export const DialogueBox: React.FC<Props> = ({ node }) => (
  <div className="p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white">
    <h3 className="font-bold text-lg mb-2">{node.speaker}</h3>
    <Typewriter text={node.text} />
  </div>
);
