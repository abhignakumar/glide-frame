import { Square } from 'lucide-react';

import { stopRecorderApi } from './api';

export default function App() {
  function handleStopRecording() {
    stopRecorderApi.stopRecording();
  }

  return (
    <div
      className="h-screen flex bg-neutral-800 p-2"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex w-full justify-center items-center">
        <button
          className="flex flex-col justify-center items-center bg-neutral-800 rounded-lg w-full h-full hover:bg-neutral-700 transition-colors duration-300 ease-in-out"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          onClick={handleStopRecording}
        >
          <Square color="#ff5a5f" fill="#ff5a5f" />
        </button>
      </div>
    </div>
  );
}
