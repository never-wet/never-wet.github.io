import React, { useEffect, useState } from "react";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

interface MathRendererProps {
  formula: string;
  block?: boolean;
}

export default function MathRenderer({ formula, block = false }: MathRendererProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <span className="font-mono opacity-50">{formula}</span>;

  return block ? (
    <div className="math-block py-4 overflow-x-auto">
      <BlockMath math={formula} />
    </div>
  ) : (
    <InlineMath math={formula} />
  );
}
