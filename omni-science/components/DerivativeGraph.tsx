import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceDot } from "recharts";
import { useMemo, useState } from "react";

export default function DerivativeGraph() {
    const [a, setA] = useState(1);
    const f = (x: number) => x * x;
    const df = (x: number) => 2 * x;

    const data = useMemo(() => {
        const points = [];
        for (let x = -5; x <= 5; x += 0.2) points.push({ x, y: f(x) });
        return points;
    }, []);

    const yA = f(a);
    const m = df(a);
    const tangent = data.map(d => ({ x: d.x, y: m * (d.x - a) + yA }));

    return (
        <div className="card">
            <h3 style={{ margin: '0 0 10px 0' }}>Interactive Derivative</h3>
            <input className="input" type="range" min={-4} max={4} step={0.1} value={a} onChange={(e) => setA(Number(e.target.value))} />
            <p className="muted">x: {a.toFixed(2)} | Slope: {m.toFixed(2)}</p>
            <div style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid stroke="#2b2f3a" vertical={false} />
                        <XAxis dataKey="x" hide />
                        <YAxis hide />
                        <Tooltip contentStyle={{ background: '#111', border: 'none' }} />
                        <Line dataKey="y" stroke="#22d3ee" dot={false} strokeWidth={3} />
                        <Line data={tangent} dataKey="y" stroke="#f59e0b" dot={false} strokeDasharray="5 5" />
                        <ReferenceDot x={a} y={yA} r={6} fill="#22d3ee" stroke="#fff" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}