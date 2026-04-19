export interface SeriesEntry {
  key: string;
  values: number[];   // one value per label, parallel to labels array
  color: string;
  areaColor?: string;
}

interface LineChartProps {
  labels: string[];
  series: SeriesEntry[];
  visibleKeys?: Set<string>;   // if omitted, all series are visible
  height?: number;
  showDots?: boolean;
}

const PAD = { top: 12, right: 12, bottom: 28, left: 30 };
const W = 360;

function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1];
    const [cx, cy] = pts[i];
    const cpX = (px + cx) / 2;
    d += ` C ${cpX},${py} ${cpX},${cy} ${cx},${cy}`;
  }
  return d;
}

export default function LineChart({
  labels,
  series,
  visibleKeys,
  height = 160,
  showDots = true,
}: LineChartProps) {
  if (labels.length === 0) return null;

  const visible = series.filter(s => !visibleKeys || visibleKeys.has(s.key));

  const plotW = W - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;

  const maxVal = Math.max(
    1,
    ...visible.flatMap(s => s.values),
  );

  const xOf = (i: number) =>
    PAD.left + (labels.length === 1 ? plotW / 2 : (i / (labels.length - 1)) * plotW);
  const yOf = (v: number) => PAD.top + plotH - (v / maxVal) * plotH;

  const yTicks = [0, Math.ceil(maxVal / 2), maxVal];

  const xLabelIndices = new Set<number>([0, labels.length - 1]);
  if (labels.length > 4) {
    const step = Math.floor(labels.length / 3);
    for (let i = step; i < labels.length - 1; i += step) xLabelIndices.add(i);
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height, display: 'block', overflow: 'visible' }}
      aria-label="Line chart"
    >
      {/* Grid lines */}
      {yTicks.map(t => (
        <line
          key={t}
          x1={PAD.left} x2={PAD.left + plotW}
          y1={yOf(t)} y2={yOf(t)}
          stroke="var(--border)"
          strokeWidth="1"
          strokeDasharray={t === 0 ? undefined : '3 3'}
        />
      ))}

      {/* One area + line per visible series */}
      {visible.map(s => {
        const pts: [number, number][] = s.values.map((v, i) => [xOf(i), yOf(v)]);
        const linePath = smoothPath(pts);
        const areaPath =
          linePath +
          ` L ${pts[pts.length - 1][0]},${PAD.top + plotH}` +
          ` L ${pts[0][0]},${PAD.top + plotH} Z`;

        return (
          <g key={s.key}>
            <path d={areaPath} fill={s.areaColor ?? s.color} opacity="0.12" />
            <path
              d={linePath}
              fill="none"
              stroke={s.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {showDots && pts.map(([x, y], i) =>
              s.values[i] > 0 ? (
                <circle key={i} cx={x} cy={y} r="3.5" fill={s.color} />
              ) : null,
            )}
          </g>
        );
      })}

      {/* Y-axis labels */}
      {yTicks.map(t => (
        <text
          key={t}
          x={PAD.left - 4} y={yOf(t) + 4}
          textAnchor="end" fontSize="9"
          fill="var(--text-faint)"
          fontFamily="Nunito, sans-serif" fontWeight="700"
        >
          {t}
        </text>
      ))}

      {/* X-axis labels */}
      {[...xLabelIndices].map(i => (
        <text
          key={i}
          x={xOf(i)} y={height - 4}
          textAnchor="middle" fontSize="9"
          fill="var(--text-faint)"
          fontFamily="Nunito, sans-serif" fontWeight="700"
        >
          {labels[i]}
        </text>
      ))}
    </svg>
  );
}
