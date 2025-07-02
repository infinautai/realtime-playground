import { loadRawAudioProcessor } from "./rawAudioProcessor";
import { loadAudioConcatProcessor } from "./audioConcatProcessor";

export type FormatConfig = {
  format: "pcm" | "ulaw";
  sampleRate: number;
};


const LIBSAMPLERATE_JS =
  "https://cdn.jsdelivr.net/npm/@alexanderolsen/libsamplerate-js@2.1.2/dist/libsamplerate.worklet.js";

export class AudioInput {
  public static async create({
    sampleRate,
    format
  }: FormatConfig ): Promise<AudioInput> {
    let context: AudioContext | null = null;
    let inputStream: MediaStream | null = null;

    try {
      const options: MediaTrackConstraints = {
        sampleRate: { ideal: sampleRate },
        echoCancellation: { ideal: true },
        noiseSuppression: { ideal: true },
        autoGainControl: { ideal: true },
        channelCount: 1,
      };

    
      const supportsSampleRateConstraint =
        navigator.mediaDevices.getSupportedConstraints().sampleRate;

      context = new window.AudioContext(
        supportsSampleRateConstraint ? { sampleRate } : {}
      );
      const analyser = context.createAnalyser();
      if (!supportsSampleRateConstraint) {
        await context.audioWorklet.addModule(LIBSAMPLERATE_JS);
      }
      await loadRawAudioProcessor(context.audioWorklet);

      console.log("audio option:", options)
      inputStream = await navigator.mediaDevices.getUserMedia({
        audio: options,
      });

      const source = context.createMediaStreamSource(inputStream);
      const worklet = new AudioWorkletNode(context, "raw-audio-processor");
      worklet.port.postMessage({ type: "setFormat", format, sampleRate });

      source.connect(analyser);
      analyser.connect(worklet);

      await context.resume();

      return new AudioInput(context, analyser, worklet, inputStream);
    } catch (error) {
      inputStream?.getTracks().forEach(track => track.stop());
      context?.close();
      throw error;
    }
  }

  private constructor(
    public readonly context: AudioContext,
    public readonly analyser: AnalyserNode,
    public readonly worklet: AudioWorkletNode,
    public readonly inputStream: MediaStream
  ) {}

  public async close() {
    this.inputStream.getTracks().forEach(track => track.stop());
    await this.context.close();
  }

  public setMuted(isMuted: boolean) {
    this.worklet.port.postMessage({ type: "setMuted", isMuted });
  }
}


export class AudioOutput {
  public static async create({
    sampleRate,
    format,
  }: FormatConfig): Promise<AudioOutput> {
    let context: AudioContext | null = null;
    try {
      context = new AudioContext({ sampleRate });
      const analyser = context.createAnalyser();
      const gain = context.createGain();
      gain.connect(analyser);
      analyser.connect(context.destination);
      await loadAudioConcatProcessor(context.audioWorklet);
      const worklet = new AudioWorkletNode(context, "audio-concat-processor");
      worklet.port.postMessage({ type: "setFormat", format });
      worklet.connect(gain);

      await context.resume();

      return new AudioOutput(context, analyser, gain, worklet);
    } catch (error) {
      context?.close();
      throw error;
    }
  }

  private constructor(
    public readonly context: AudioContext,
    public readonly analyser: AnalyserNode,
    public readonly gain: GainNode,
    public readonly worklet: AudioWorkletNode
  ) {}

  public async close() {
    await this.context.close();
  }
}


export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function arrayBufferToBase64(b: ArrayBufferLike) {
  const buffer = new Uint8Array(b);
  // @ts-ignore
  const base64Data = window.btoa(String.fromCharCode(...buffer));
  return base64Data;
}