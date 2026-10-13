import { useId } from "react";
import type { Theme } from "../lib/domain";
export function Mark() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M5 31V12l8 4 7-11 7 11 8-4v19H25V22l-5 8-5-8v9Z"
        fill="currentColor"
      />
    </svg>
  );
}
export function AgentFace({
  large = false,
  active = false,
  working = false,
  equipment = "",
}: {
  large?: boolean;
  active?: boolean;
  working?: boolean;
  equipment?: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 100 116"
      aria-hidden="true"
      className={`agent-art ${large ? "large" : ""} ${active ? "facing" : ""}`}
    >
      <defs>
        <linearGradient id={`body${id}`} x2=".7" y2="1">
          <stop stopColor="#f7f4e9" />
          <stop offset="1" stopColor="#a5c5be" />
        </linearGradient>
        <linearGradient id={`glass${id}`} x2="0" y2="1">
          <stop stopColor="#263d3b" />
          <stop offset="1" stopColor="#0a211f" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="108" rx="31" ry="6" fill="#13242a" opacity=".25" />
      <path
        d="M34 85v17q-2 8-10 5v-9l4-15M65 84v20q8 9 12 1V94l-4-12"
        fill="#abc1b5"
        stroke="#75968d"
        strokeWidth="2"
      />
      <rect
        x="27"
        y="66"
        width="47"
        height="30"
        rx="16"
        fill={`url(#body${id})`}
      />
      <path
        d="M30 74q-17-3-14 16M71 74q16 0 16 16"
        stroke="#dce5d8"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M49 22V10" stroke="#dce5d8" strokeWidth="4" />
      <circle cx="49" cy="8" r="5" fill="#d0f58a" />
      <rect x="7" y="37" width="10" height="22" rx="5" fill="#b1c6bb" />
      <rect x="83" y="37" width="10" height="22" rx="5" fill="#b1c6bb" />
      <rect
        x="13"
        y="21"
        width="74"
        height="54"
        rx="25"
        fill={`url(#body${id})`}
      />
      <rect
        x="23"
        y="34"
        width="54"
        height="29"
        rx="13"
        fill={`url(#glass${id})`}
      />
      <path
        d="M29 39q18-6 38 0"
        stroke="#94c2ab"
        strokeWidth="2"
        opacity=".3"
        fill="none"
      />
      <rect
        x={active ? 35 : 33}
        y="43"
        width="6"
        height={active ? 9 : 7}
        rx="3"
        fill="#d1fd96"
      />
      <rect
        x={active ? 59 : 55}
        y="43"
        width="6"
        height={active ? 9 : 7}
        rx="3"
        fill="#d1fd96"
      />
      <path
        d="M45 56q5 4 10 0"
        stroke="#c7f28d"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="21" cy="61" r="3" fill="#efb89f" />
      <circle cx="79" cy="61" r="3" fill="#efb89f" />
      <path d="M43 80l7 7 7-7" stroke="#58766b" strokeWidth="2" fill="none" />
      {!active && equipment === "gaming" && (
        <g transform="translate(28 78)">
          <path
            d="M8 0h30q10 0 11 13l-4 7-12-6H15L4 20-1 13Q0 0 8 0Z"
            fill="#374558"
          />
          <path d="M8 7h11m-6-5v11" stroke="#bbdf9a" strokeWidth="3" />
          <circle cx="37" cy="6" r="2" fill="#edbe9e" />
          <circle cx="41" cy="11" r="2" fill="#d3b2e9" />
        </g>
      )}
      {!active && equipment === "typing" && (
        <g transform="translate(24 79)">
          <path d="M5 0h45l6 17H0Z" fill="#526278" />
          <path
            d="M9 5h37M7 10h41"
            stroke="#bbcad8"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
          <path d="M20 14h18" stroke="#c9dec2" strokeWidth="2" />
        </g>
      )}
      {!active && equipment === "teaching" && (
        <g transform="translate(27 77)">
          <path
            d="M0 0q10-3 22 3Q34-3 45 0v23q-11-3-23 2Q11 20 0 23Z"
            fill="#ece2bd"
          />
          <path
            d="M22 3v22M5 7h11M28 7h11M5 12h11M28 12h11"
            stroke="#8f987d"
            strokeWidth="2"
          />
        </g>
      )}
      {!active && equipment === "repair" && (
        <path
          d="m68 91 15-22m-1-11q-8 3-2 13 10 2 11-7l-7 2Z"
          fill="#9eacbb"
          stroke="#9eacbb"
          strokeWidth="4"
        />
      )}
      {!active && working && (
        <g transform="translate(64 83)">
          <path d="M0 0h25l-4 13H4Z" fill="#e5b975" />
          <path
            d="M17 2l9-6 8 3"
            fill="none"
            stroke="#e5b975"
            strokeWidth="4"
          />
        </g>
      )}
    </svg>
  );
}
function Tree({
  x,
  y,
  scale = 1,
  color = "#9cd8b7",
  kind = 0,
}: {
  x: number;
  y: number;
  scale?: number;
  color?: string;
  kind?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cy="6" rx="34" ry="10" fill="#174b46" opacity=".2" />
      <path
        d="M0 2v-91m0 43-21-19M0-60l20-18"
        fill="none"
        stroke="#426f69"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {kind === 1 ? (
        <>
          <path d="M0-132 42-58H22L43-27h-86l21-31h-19Z" fill={color} />
          <path d="M0-132v105h43L22-58h20Z" fill="#1d6e64" opacity=".2" />
        </>
      ) : (
        <>
          <ellipse cy="-90" rx="40" ry="49" fill={color} />
          <ellipse cx="-23" cy="-65" rx="27" ry="29" fill={color} />
          <ellipse cx="26" cy="-61" rx="26" ry="31" fill={color} />
          <path
            d="M-17-102q18-16 34 0"
            stroke="#ffffff"
            opacity=".22"
            strokeWidth="3"
            fill="none"
          />
        </>
      )}
    </g>
  );
}
function Mushroom({
  x,
  y,
  scale = 1,
  color = "#e6aacd",
}: {
  x: number;
  y: number;
  scale?: number;
  color?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cy="3" rx="40" ry="12" fill="#215b4a" opacity=".2" />
      <path
        d="M-12-59C-8-41-10-16-21 0Q0 14 19 0C8-25 8-44 13-60"
        fill="#f7ddb8"
      />
      <path d="M-72-64Q-46-122 0-124T70-64Q0-28-72-64Z" fill={color} />
      <ellipse cy="-64" rx="71" ry="18" fill="#4c3f68" opacity=".3" />
      <ellipse
        cx="-33"
        cy="-87"
        rx="12"
        ry="6"
        transform="rotate(-20 -33 -87)"
        fill="#ffedcf"
        opacity=".8"
      />
      <ellipse cx="11" cy="-108" rx="13" ry="6" fill="#ffedcf" opacity=".8" />
      <ellipse
        cx="38"
        cy="-80"
        rx="10"
        ry="6"
        transform="rotate(25 38 -80)"
        fill="#ffedcf"
        opacity=".8"
      />
      <path d="M-5-47v40" stroke="#b49e94" opacity=".6" strokeWidth="3" />
    </g>
  );
}
export function WorldArt({ theme }: { theme: Theme }) {
  const id = useId().replace(/:/g, "");
  const nature = theme === "nature",
    neuron = theme === "neuron";
  return (
    <svg
      className="world-art"
      viewBox="0 0 1000 570"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`sky${id}`} x2=".6" y2="1">
          <stop
            stopColor={nature ? "#263c46" : neuron ? "#322b5b" : "#222b50"}
          />
          <stop
            offset="1"
            stopColor={nature ? "#446b63" : neuron ? "#686284" : "#587b82"}
          />
        </linearGradient>
        <linearGradient id={`land${id}`} x2=".5" y2="1">
          <stop
            stopColor={nature ? "#a6c88a" : neuron ? "#beb1d8" : "#b0c9c7"}
          />
          <stop
            offset="1"
            stopColor={nature ? "#599885" : neuron ? "#7767a9" : "#658e95"}
          />
        </linearGradient>
        <linearGradient id={`rock${id}`} x2="0" y2="1">
          <stop stopColor={neuron ? "#6d5886" : "#467c70"} />
          <stop offset="1" stopColor="#1a383e" />
        </linearGradient>
        <radialGradient id={`moon${id}`} cx=".3" cy=".3">
          <stop stopColor="#ffd8ae" />
          <stop offset="1" stopColor="#d8a6b5" />
        </radialGradient>
        <pattern
          id={`stars${id}`}
          width="167"
          height="139"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="20" cy="17" r="1.2" fill="#d3edd4" opacity=".6" />
          <circle cx="110" cy="60" r="1.6" fill="#d3edd4" opacity=".5" />
          <circle cx="64" cy="112" r="1" fill="#d3edd4" opacity=".3" />
        </pattern>
      </defs>
      <rect width="1000" height="570" fill={`url(#sky${id})`} />
      <rect width="1000" height="570" fill={`url(#stars${id})`} />
      <g className="sky-orbit">
        <circle cx="810" cy="120" r="54" fill={`url(#moon${id})`} />
        <ellipse
          cx="810"
          cy="120"
          rx="97"
          ry="23"
          fill="none"
          stroke="#eacbd3"
          strokeWidth="8"
          transform="rotate(-26 810 120)"
          opacity=".7"
        />
        <ellipse
          cx="796"
          cy="101"
          rx="12"
          ry="17"
          fill="#fbe6c4"
          opacity=".28"
        />
      </g>
      <path
        d="M-70 233Q123 134 271 212t251 3 252 18 303-21"
        stroke="#b7d9b5"
        strokeWidth="2"
        fill="none"
        opacity=".16"
      />
      <ellipse
        cx="510"
        cy="535"
        rx="346"
        ry="22"
        fill="#182e39"
        opacity=".45"
      />
      <path
        d="M93 369L176 467 346 508 548 536 749 486 908 405 820 328 195 299Z"
        fill={`url(#rock${id})`}
      />
      <path
        d="M176 382v84l171 42-44-101M484 422l64 114 47-114M749 393v93l90-111"
        fill="#234e4b"
        opacity=".3"
      />
      <path
        d="M93 369C48 315 153 265 262 251c44-97 219-112 312-63 65-8 143 15 159 52 81-11 207 65 175 132-15 62-114 70-191 71-64 57-211 38-279 12-129 16-300-21-345-86Z"
        fill={`url(#land${id})`}
      />
      <path
        d="M117 363c112 55 176 42 279 69 116 30 204 18 306-6 110-25 132-25 176-66"
        fill="none"
        stroke="#cde5b3"
        strokeWidth="3"
        opacity=".4"
      />
      <path
        d="M539 206c-59 47-37 73-100 100-57 26-26 37 4 53 33 19 36 39-18 85"
        stroke={neuron ? "#deaccd" : "#e0d3a8"}
        strokeWidth="25"
        fill="none"
        opacity=".75"
      />
      <path
        d="M447 345c83 23 150 2 226 17"
        stroke={neuron ? "#deaccd" : "#e0d3a8"}
        strokeWidth="18"
        fill="none"
        opacity=".75"
      />
      {nature && (
        <>
          <Tree x={246} y={288} scale={0.95} color="#72bfb4" />
          <Tree x={304} y={246} scale={0.7} color="#b3cf8b" kind={1} />
          <Tree x={651} y={237} scale={0.7} color="#d7b4c5" />
          <Tree x={727} y={297} scale={0.9} color="#8bd0af" />
          <Tree x={176} y={341} scale={0.55} color="#d4c594" />
          <Tree x={836} y={358} scale={0.6} color="#c5cb85" kind={1} />
          <Mushroom x={577} y={276} scale={1.18} />
          <Mushroom x={630} y={304} scale={0.57} color="#edd1a1" />
          <Mushroom x={299} y={413} scale={0.68} color="#eca3a0" />
          <Mushroom x={337} y={426} scale={0.35} color="#eac5a0" />
          <Mushroom x={785} y={415} scale={0.42} />
          <g transform="translate(336 291) rotate(-12)">
            <path d="M0 0h66v37H0Z" fill="#688264" />
            <path
              d="M5 8h56M5 19h56M5 29h56"
              stroke="#d6c196"
              strokeWidth="4"
            />
            {[12, 28, 45, 60].map((x) => (
              <path
                key={x}
                d={`M${x} 8q-12-15 0-14 12-1 0 14`}
                fill="#caf291"
              />
            ))}
          </g>
          <g transform="translate(658 404)">
            <path
              d="M0 0h54v12H0Zm6 12v15m42-15v15"
              stroke="#d2b58a"
              strokeWidth="6"
              fill="#d2b58a"
            />
          </g>
        </>
      )}
      {!nature && !neuron && (
        <>
          <g transform="translate(282 263)">
            <ellipse cy="10" rx="77" ry="23" fill="#658d8f" />
            <path d="M-65 0a65 65 0 0 1 130 0Z" fill="#cad8cb" opacity=".9" />
            <path
              d="M-50 0a50 50 0 0 1 100 0M0-64v64"
              fill="none"
              stroke="#729995"
              strokeWidth="3"
            />
            <path d="M-15 0v-28h30V0" fill="#4c7a7c" />
          </g>
          <g transform="translate(689 254)">
            <path d="M0 0 18-75 49-91 79-75 95 0Z" fill="#dbc7b9" />
            <path d="M18-75h61L50-40Z" fill="#e9d9c1" />
            <path d="M34-18v-28h29v28" fill="#426d79" />
            <path d="M34-39h29M42-47v30" stroke="#98c5cb" strokeWidth="2" />
            <path d="M0 0h96" stroke="#425e69" strokeWidth="8" />
          </g>
          <g transform="translate(586 361)">
            <ellipse cx="0" cy="18" rx="15" ry="19" fill="#3a555b" />
            <ellipse cx="66" cy="18" rx="15" ry="19" fill="#3a555b" />
            <path d="M-7 14v-32h74v32Z" fill="#edcb97" />
            <path d="M5-18 18-42h31l13 24" fill="#9bc8cc" />
            <path d="M8-2h17M45-2h17" stroke="#fff0b9" strokeWidth="5" />
          </g>
          <Tree x={175} y={360} scale={0.62} color="#b7afd3" kind={1} />
          <Tree x={825} y={371} scale={0.63} color="#9ad6c7" kind={1} />
          {[370, 420, 770].map((x, i) => (
            <g key={x} transform={`translate(${x} ${260 + i * 56})`}>
              <path d="m0 0 12-50 24 50Z" fill="#b9cbdc" />
              <path d="m12-50 12 50H12Z" fill="#e7ddd1" />
            </g>
          ))}
        </>
      )}
      {neuron && (
        <>
          <g stroke="#e0b4d5" strokeWidth="5" fill="none" opacity=".75">
            <path d="M238 247Q330 133 434 242T698 266M240 247Q363 398 506 346T792 366M434 242l72 104M698 266l94 100M308 396l198-50" />
            <path
              d="M434 242 378 177m56 65 9-92m255 116 20-113m-20 113 83-53M240 247l-53-68M308 396l-86 28M506 346l33 90"
              strokeWidth="3"
            />
          </g>
          {[
            [238, 247, 40],
            [434, 242, 56],
            [698, 266, 44],
            [506, 346, 37],
            [308, 396, 30],
            [792, 366, 36],
          ].map(([x, y, r], i) => (
            <g key={x}>
              <circle
                cx={x}
                cy={y}
                r={r}
                fill={i % 2 ? "#bc95dd" : "#91d6d1"}
                opacity=".25"
              />
              <circle
                cx={x}
                cy={y}
                r={r * 0.6}
                fill={i % 2 ? "#d6bbe9" : "#b4edcf"}
              />
              <circle
                cx={x - 6}
                cy={y - 8}
                r={r * 0.18}
                fill="#fff1d8"
                opacity=".7"
              />
            </g>
          ))}
          <Mushroom x={170} y={350} scale={0.45} color="#dabbe7" />
          <Tree x={850} y={304} scale={0.5} color="#dab0d4" />
        </>
      )}
      {Array.from({ length: 25 }, (_, i) => (
        <g
          key={i}
          transform={`translate(${150 + ((i * 137) % 720)} ${290 + ((i * 47) % 160)})`}
        >
          <path
            d="M0 0q-5-14-9-10M0 0q2-16 6-12"
            stroke={neuron ? "#d8c4ee" : "#376f58"}
            strokeWidth="2"
            fill="none"
          />
          {i % 3 === 0 && <circle cx="5" cy="-13" r="3" fill="#f4d2aa" />}
        </g>
      ))}
      <path
        d="M28 460q46-40 76-2t46 37M884 518q85-71 160-22"
        stroke="#c6e9be"
        opacity=".12"
        strokeWidth="2"
        fill="none"
      />
      <g fill="#dce3c7" opacity=".6">
        <path
          d="M136 114v12m-6-6h12M667 89v8m-4-4h8M917 241v10m-5-5h10"
          stroke="#dce3c7"
          strokeWidth="2"
        />
      </g>
    </svg>
  );
}
