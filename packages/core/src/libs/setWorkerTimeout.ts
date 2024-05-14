import TimeoutWorker from "./workers/timeout-worker?worker";

export function setWorkerTimeout(func: () => void, timeout: number) {
  const worker = new TimeoutWorker();
  let messageId = 0; // Unique ID for each message

  const callbackWrapper = (id: number) => {
    worker.postMessage({ signal: "start", timeout, id });
  };

  worker.onmessage = (e) => {
    if (e.data.signal === "timeout" && e.data.id === messageId) {
      func();
    }
  };

  callbackWrapper(++messageId);

  return () => {
    worker.postMessage({ signal: "stop", id: messageId });
    worker.terminate();
  };
}
