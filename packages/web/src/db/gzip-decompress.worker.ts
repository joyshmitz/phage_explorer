import { ungzip } from 'pako';

type WorkerRequest = { id: number; data: Uint8Array };
type WorkerResponse =
  | { id: number; ok: true; buffer: ArrayBuffer }
  | { id: number; ok: false; error: string };

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, data } = event.data;
  try {
    const result = ungzip(data);
    const bytes = result instanceof Uint8Array ? result : new Uint8Array(result);

    // Ensure the returned ArrayBuffer is exactly the decompressed byte length.
    // Some Uint8Array results can be views into a larger buffer; the main thread
    // reconstructs via `new Uint8Array(buffer)`, so we must avoid over-sized buffers.
    const out = bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
      ? bytes
      : bytes.slice();

    const response: WorkerResponse = { id, ok: true, buffer: out.buffer };
    self.postMessage(response, [out.buffer]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const response: WorkerResponse = { id, ok: false, error: message };
    self.postMessage(response);
  }
};

export {};
