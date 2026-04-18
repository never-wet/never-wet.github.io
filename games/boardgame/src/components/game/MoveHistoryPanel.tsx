interface MoveHistoryPanelProps {
  moves: string[];
}

export function MoveHistoryPanel({ moves }: MoveHistoryPanelProps) {
  return (
    <section className="surface-card sidebar-card">
      <div className="panel-heading">
        <h3>Move History</h3>
        <span>{moves.length} entries</span>
      </div>
      {moves.length ? (
        <ol className="move-history">
          {moves.map((move, index) => (
            <li key={`${move}-${index}`}>
              <span>{index + 1}.</span>
              <span>{move}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="empty-copy">No moves yet. Start the board to build the log.</p>
      )}
    </section>
  );
}
