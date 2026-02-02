export function Controls({ isStarted, isConnected, onStart, onNext, onStop }) {
  return (
    <div className="controls">
      {!isStarted ? (
        <button className="btn btn-start" onClick={onStart} aria-label="Start video chat">
          Start
        </button>
      ) : (
        <>
          <button
            className="btn btn-next"
            onClick={onNext}
            disabled={!isConnected}
            aria-label="Skip to next person"
          >
            Next
          </button>
          <button className="btn btn-stop" onClick={onStop} aria-label="Stop video chat">
            Stop
          </button>
        </>
      )}
    </div>
  );
}
