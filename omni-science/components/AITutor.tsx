import { useState } from "react";

export default function AITutor({ concept }: any) {
    const [msgs, setMsgs] = useState([{ role: "ai", text: `I'm your tutor for ${concept.title}. How can I help?` }]);
    const [input, setInput] = useState("");

    const ask = () => {
        setMsgs([...msgs, { role: "user", text: input }]);
        setInput("");
        setTimeout(() => {
            setMsgs(prev => [...prev, { role: "ai", text: `In simple terms: ${concept.analogy}` }]);
        }, 600);
    };

    return (
        <div className="card">
            <h4>AI Tutor</h4>
            <div style={{ height: 150, overflowY: "auto", marginBottom: 10 }}>
                {msgs.map((m, i) => <p key={i} style={{ color: m.role === 'ai' ? '#22d3ee' : '#fff' }}><b>{m.role.toUpperCase()}:</b> {m.text}</p>)}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask a question..." />
                <button className="btn" onClick={ask}>Send</button>
            </div>
        </div>
    );
}