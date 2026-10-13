import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Gamepad2,
  Leaf,
  Maximize2,
  Minimize2,
  Music2,
  Pause,
  Play,
  Sparkles,
  Sprout,
  Volume2,
  VolumeX,
  Wrench,
} from "lucide-react";
import { AGENTS, activity, themes, type Theme } from "../lib/domain";
import { AmbientMusic } from "../lib/audio";
import { AgentFace, WorldArt } from "./Art";
const positions = [
  [23, 45],
  [23, 61],
  [49, 43],
  [76, 45],
  [50, 61],
  [77, 61],
  [23, 77],
  [49, 77],
  [77, 77],
];
export default function World({
  theme,
  setTheme,
  onAgent,
  selectedAgent,
  full = false,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
  onAgent: (id: number) => void;
  selectedAgent: number | null;
  full?: boolean;
}) {
  const [paused, setPaused] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [tick, setTick] = useState(0);
  const [offsets, setOffsets] = useState(AGENTS.map(() => [0, 0]));
  const [music, setMusic] = useState(false),
    [track, setTrack] = useState(0),
    [showAudio, setShowAudio] = useState(false);
  const [expanded, setExpanded] = useState(false),
    [help, setHelp] = useState(false);
  const audio = useRef(new AmbientMusic());
  const [audioError, setAudioError] = useState("");
  const [volume, setVolume] = useState(0.35);
  const [audioBusy, setAudioBusy] = useState(false);
  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      if (document.hidden) return;
      setTick((t) => t + 1);
      setOffsets((old) =>
        old.map((v, i) =>
          selectedAgent === AGENTS[i]
            ? v
            : [Math.random() * 3 - 1.5, Math.random() * 2 - 1],
        ),
      );
    }, 4500);
    return () => clearInterval(interval);
  }, [paused, selectedAgent]);
  useEffect(() => {
    const instance = audio.current;
    return () => instance.stop();
  }, []);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const fn = () => {
      if (query.matches) setPaused(true);
    };
    query.addEventListener("change", fn);
    return () => query.removeEventListener("change", fn);
  }, []);
  async function toggleAudio(newTrack = track) {
    setAudioError("");
    if (music && newTrack === track) {
      audio.current.stop();
      setMusic(false);
      return;
    }
    try {
      setAudioBusy(true);
      if (await audio.current.start(newTrack)) {
        setTrack(newTrack);
        setMusic(true);
      }
    } catch {
      setAudioError("Não foi possível iniciar o áudio. Tente novamente.");
      setMusic(false);
    } finally {
      setAudioBusy(false);
    }
  }
  async function changeTrack(direction: number) {
    const next = (track + direction + 3) % 3;
    setTrack(next);
    if (music) {
      try {
        setAudioBusy(true);
        await audio.current.start(next);
      } catch {
        setMusic(false);
        setAudioError("Áudio indisponível. Tente ativá-lo novamente.");
      } finally {
        setAudioBusy(false);
      }
    }
  }
  const current = themes[theme];
  return (
    <section
      className={`world-shell ${expanded ? "expanded" : ""} ${full ? "world-full" : ""}`}
      aria-label="Mapa interativo do enxame"
    >
      <div className="world-toolbar">
        <div className="world-tabs" aria-label="Escolher mundo">
          {(["nature", "planet", "neuron"] as Theme[]).map((t) => (
            <button
              key={t}
              aria-pressed={theme === t}
              className={theme === t ? "selected" : ""}
              onClick={() => setTheme(t)}
            >
              {t === "nature" ? (
                <Leaf size={16} />
              ) : t === "planet" ? (
                <Sparkles size={16} />
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    d="M5 5 15 5 10 15 5 5Zm0 0 10 10M10 15 2 12"
                    fill="none"
                    stroke="currentColor"
                  />
                  <circle cx="5" cy="5" r="3" fill="currentColor" />
                  <circle cx="15" cy="5" r="3" fill="currentColor" />
                  <circle cx="10" cy="15" r="3" fill="currentColor" />
                </svg>
              )}
              {t === "nature"
                ? "Natureza"
                : t === "planet"
                  ? "Planeta"
                  : "Sinapses"}
            </button>
          ))}
        </div>
        <div className="audio-tools">
          <button
            className={`icon-button ${music ? "is-on" : ""}`}
            onClick={() => void toggleAudio()}
            aria-label={music ? "Pausar música" : "Ativar música instrumental"}
            aria-pressed={music}
            disabled={audioBusy}
            aria-busy={audioBusy}
          >
            {music ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
          <button
            className="icon-button audio-expand"
            onClick={() => setShowAudio(!showAudio)}
            aria-label="Ajustar música"
            aria-expanded={showAudio}
          >
            <Music2 size={17} />
          </button>
        </div>
      </div>
      {showAudio && (
        <div className="audio-panel">
          <button
            className="icon-button"
            onClick={() => void changeTrack(-1)}
            aria-label="Música anterior"
            disabled={audioBusy}
          >
            <ChevronLeft size={20} />
          </button>
          <span>
            {["Raízes sonoras", "Além da órbita", "Ondas da mente"][track]}
          </span>
          <button
            className="icon-button"
            onClick={() => void changeTrack(1)}
            aria-label="Próxima música"
            disabled={audioBusy}
          >
            <ChevronRight size={20} />
          </button>
          <label>
            Volume
            <input
              aria-label="Volume da música"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => {
                const next = Number(e.target.value);
                setVolume(next);
                audio.current.setVolume(next);
              }}
            />
          </label>
        </div>
      )}
      {audioError && (
        <p className="inline-error" role="alert">
          {audioError}
        </p>
      )}
      <div className={`world-scene ${paused ? "paused" : ""}`}>
        <WorldArt theme={theme} />
        <div className="scene-heading">
          <span className="scene-coordinate">
            01 /{" "}
            {theme === "nature"
              ? "Gaia"
              : theme === "planet"
                ? "Aurora"
                : "Sinapse"}
          </span>
          <h2>{current.name}</h2>
          <p>{current.subtitle}</p>
        </div>
        <div className="scene-tools">
          <button
            className="icon-button"
            onClick={() => setPaused(!paused)}
            aria-label={
              paused
                ? "Retomar movimento dos agentes"
                : "Pausar movimento dos agentes"
            }
            aria-pressed={paused}
          >
            {paused ? <Play size={17} /> : <Pause size={17} />}
          </button>
          <button
            className="icon-button"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? "Reduzir mapa" : "Ampliar mapa"}
          >
            {expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
        </div>
        {AGENTS.map((id, i) => {
          const a = activity(id, theme, tick);
          return (
            <button
              key={id}
              data-column={
                positions[i][0] < 30
                  ? "left"
                  : positions[i][0] > 70
                    ? "right"
                    : "center"
              }
              className={`map-agent ${selectedAgent === id ? "agent-selected" : ""}`}
              style={{
                left: `${positions[i][0] + offsets[i][0]}%`,
                top: `${positions[i][1] + offsets[i][1]}%`,
                zIndex: Math.round(positions[i][1]),
              }}
              onClick={(e) => {
                const el = e.currentTarget;
                const parent = el.parentElement!;
                const style = getComputedStyle(el);
                const x = (parseFloat(style.left) / parent.clientWidth) * 100;
                const y = (parseFloat(style.top) / parent.clientHeight) * 100;
                setOffsets((old) =>
                  old.map((v, j) =>
                    j === i ? [x - positions[i][0], y - positions[i][1]] : v,
                  ),
                );
                onAgent(id);
              }}
              aria-label={`Conhecer Agente #${id}: ${a.text}`}
            >
              <AgentFace
                active={selectedAgent === id}
                working={!a.leisure && a.text.includes("Irrigando")}
                equipment={
                  a.text.includes("jogos")
                    ? "gaming"
                    : a.text.includes("digitação")
                      ? "typing"
                      : a.text.includes("Ensinando")
                        ? "teaching"
                        : a.text.includes("Reparando")
                          ? "repair"
                          : ""
                }
              />
              <span className="agent-task" aria-hidden="true">
                {a.leisure ? (
                  <Gamepad2 size={12} />
                ) : id % 3 === 0 ? (
                  <BookOpen size={12} />
                ) : theme === "planet" ? (
                  <Wrench size={12} />
                ) : (
                  <Sprout size={12} />
                )}
              </span>
              <span className="agent-tooltip">
                Agente #{id}
                <small>{a.text}</small>
              </span>
            </button>
          );
        })}
        <div className="scene-bottom">
          <span>
            <i className="status-dot" />
            {AGENTS.length} agentes · simulação
          </span>
          <button
            className="scene-help"
            aria-label="Como explorar o mapa"
            onClick={() => setHelp(!help)}
            aria-expanded={help}
          >
            <CircleHelp size={18} />
            <span>Como explorar</span>
          </button>
        </div>
      </div>
      <div className="world-caption">
        <span>
          <span className="cursor-mark">
            <ArrowUpRight size={16} />
          </span>
          Selecione um agente para conhecê-lo.
        </span>
        <a href="#votar">
          Descobrir projetos <ArrowUpRight size={16} />
        </a>
      </div>
      {help && (
        <div className="world-help">
          <p>
            Escolha um dos três mundos e selecione um agente. Ele para e olha
            para você. Use Tab e Enter para navegar pelo mapa. Pause os
            movimentos no canto superior direito.
          </p>
          <p>
            Esta é uma simulação local. As atividades e avaliações não vêm de
            agentes conectados a modelos de IA.
          </p>
          <button className="text-button" onClick={() => setHelp(false)}>
            Entendi <ArrowDown size={16} />
          </button>
        </div>
      )}
    </section>
  );
}
