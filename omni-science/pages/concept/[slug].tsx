import { useRouter } from "next/router";
import { scienceDatabase } from "../../data/scienceDatabase";
import DerivativeGraph from "../../components/DerivativeGraph";
import AITutor from "../../components/AITutor";

export default function ConceptPage() {
    const { query } = useRouter();
    const concept = scienceDatabase.find(c => c.slug === query.slug);

    if (!concept) return <div className="app">Loading...</div>;

    return (
        <div className="app">
            <div className="sidebar" style={{ padding: 20 }}>
                <button className="btn" onClick={() => window.location.href = '/'}>← Back</button>
            </div>
            <div className="main" style={{ padding: 40, overflowY: 'auto' }}>
                <h1 style={{ fontSize: '3rem', margin: 0 }}>{concept.title}</h1>
                <p className="muted" style={{ fontSize: '1.2rem' }}>{concept.subject} • {concept.level}</p>
                <div className="card" style={{ fontSize: '1.5rem', textAlign: 'center' }}>{concept.formula}</div>
                <p>{concept.text}</p>
                {concept.slug === 'derivative' && <DerivativeGraph />}
            </div>
            <div className="right" style={{ padding: 20 }}>
                <AITutor concept={concept} />
            </div>
        </div>
    );
}