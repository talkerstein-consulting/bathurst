/// <reference lib="webworker" />
// Unpacks and triangulates the city off the main thread (see map-bake.ts). In: {buf, lite}. Out: {city} or {error}.
import { bakeCity, gunzip, transferables } from "./map-bake";

self.onmessage = async (e: MessageEvent<{ buf: ArrayBuffer; gz: boolean; lite: boolean }>) => {
  try {
    const { buf, gz, lite } = e.data;
    const city = bakeCity(gz ? await gunzip(buf) : buf, lite);
    (self as unknown as DedicatedWorkerGlobalScope).postMessage({ city }, transferables(city));
  } catch (err) {
    self.postMessage({ error: String(err) });
  }
};
