export function Controls({ isStarted, isConnected, onStart, onNext, onStop }) {
  return (
    <div className="controls">
      {!isStarted ? (
        <button className="btn btn-start" onClick={onStart}>
          Start
        </button>
      ) : (
        <>
          <button
            className="btn btn-next"
            onClick={onNext}
            disabled={!isConnected}
          >
            Next
          </button>
          <button className="btn btn-stop" onClick={onStop}>
            Stop
          </button>
        </>
      )}
    </div>
  );
}
