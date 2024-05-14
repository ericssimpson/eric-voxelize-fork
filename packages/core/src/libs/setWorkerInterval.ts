import IntervalWorker from "./workers/interval-worker?worker";

export function setWorkerInterval(func: () => void, interval: number) {
  const worker = new IntervalWorker();

  worker.postMessage({ signal: "start", interval });

  worker.onmessage = (e) => {
    if (e.data === "tick") {
      func();
    }
  };

  return () => {
    worker.postMessage({ signal: "stop" });
    worker.terminate();
  };
}
