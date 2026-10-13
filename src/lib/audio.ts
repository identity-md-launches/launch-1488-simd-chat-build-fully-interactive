// Original instrumental music, synthesized locally. No streaming, recordings or autoplay.
const scales = [
  [261.63, 329.63, 392, 523.25, 440, 392, 329.63, 293.66],
  [220, 277.18, 329.63, 440, 369.99, 329.63, 277.18, 246.94],
  [293.66, 369.99, 440, 587.33, 493.88, 440, 369.99, 329.63],
];
export class AmbientMusic {
  context: AudioContext | null = null;
  timer: ReturnType<typeof setInterval> | null = null;
  gain: GainNode | null = null;
  step = 0;
  track = 0;
  volume = 0.35;
  revision = 0;
  async start(track: number) {
    this.stop();
    this.track = track;
    this.step = 0;
    const revision = this.revision;
    const context = new AudioContext();
    this.context = context;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        context.resume(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error("Áudio indisponível neste navegador.")),
            4000,
          );
        }),
      ]);
    } catch (error) {
      if (revision === this.revision) {
        this.stop();
        throw error;
      }
      return false;
    } finally {
      clearTimeout(timer);
    }
    if (revision !== this.revision || this.context !== context) return false;
    this.gain = this.context.createGain();
    this.gain.gain.value = this.volume * 0.25;
    this.gain.connect(this.context.destination);
    this.note();
    this.timer = setInterval(() => this.note(), 550);
    return true;
  }
  note() {
    if (!this.context || !this.gain) return;
    const now = this.context.currentTime,
      scale = scales[this.track % 3];
    const osc = this.context.createOscillator(),
      envelope = this.context.createGain();
    osc.type = "sine";
    osc.frequency.value = scale[this.step % scale.length];
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(0.8, now + 0.06);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + 1.9);
    osc.connect(envelope);
    envelope.connect(this.gain);
    osc.start(now);
    osc.stop(now + 2);
    osc.onended = () => {
      osc.disconnect();
      envelope.disconnect();
    };
    if (this.step % 4 === 0) {
      const bass = this.context.createOscillator(),
        bg = this.context.createGain();
      bass.frequency.value = scale[0] / 2;
      bg.gain.setValueAtTime(0.001, now);
      bg.gain.linearRampToValueAtTime(0.25, now + 0.3);
      bg.gain.exponentialRampToValueAtTime(0.001, now + 2.1);
      bass.connect(bg);
      bg.connect(this.gain);
      bass.start(now);
      bass.stop(now + 2.2);
      bass.onended = () => {
        bass.disconnect();
        bg.disconnect();
      };
    }
    this.step++;
  }
  setVolume(value: number) {
    this.volume = value;
    if (this.context && this.gain)
      this.gain.gain.setTargetAtTime(
        value * 0.25,
        this.context.currentTime,
        0.1,
      );
  }
  stop() {
    this.revision++;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.context) void this.context.close().catch(() => {});
    this.context = null;
    this.gain = null;
  }
}
