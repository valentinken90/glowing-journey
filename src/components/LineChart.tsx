interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  color?: string;
  areaColor?: string;
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
  data,
  color = 'var(--primary)',
  areaColor,
  height = 160,
  showDots = true,
}: LineChartProps) {
  if (data.length === 0) return null;

  const plotW = W - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const maxVal = Math.max(1, ...data.map(d => d.value));

  const xOf = (i: number) => PAD.left + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const yOf = (v: number) => PAD.top + plotH - (v / maxVal) * plotH;

  const pts: [number, number][] = data.map((d, i) => [xOf(i), yOf(d.value)]);
  const linePath = smoothPath(pts);

  // Area: go down the right edge, along the bottom, back up
  const areaPath =
    linePath +
    ` L ${pts[pts.length - 1][0]},${PAD.top + plotH}` +
    ` L ${pts[0][0]},${PAD.top + plotH} Z`;

  // Y-axis ticks (0 and max)
  const yTicks = [0, Math.ceil(maxVal / 2), maxVal];

  // X-axis labels: show first, last, and at most 3 equally-spaced middle ones
  const xLabelIndices = new Set<number>([0, data.length - 1]);
  if (data.length > 4) {
    const step = Math.floor(data.length / 3);
    for (let i = step; i < data.length - 1; i += step) xLabelIndices.add(i);
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
          x1={PAD.left}
          x2={PAD.left + plotW}
          y1={yOf(t)}
          y2={yOf(t)}
          stroke="var(--border)"
          strokeWidth="1"
          strokeDasharray={t === 0 ? undefined : '3 3'}
        />
      ))}

      {/* Area fill */}
      <path d={areaPath} fill={areaColor ?? color} opacity="0.12" />

      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {showDots && pts.map(([x, y], i) => (
        data[i].value > 0 && (
          <circle key={i} cx={x} cy={y} r="3.5" fill={color} />
        )
      ))}

      {/* Y-axis labels */}
      {yTicks.map(t => (
        <text
          key={t}
          x={PAD.left - 4}
          y={yOf(t) + 4}
          textAnchor="end"
          fontSize="9"
          fill="var(--text-faint)"
          fontFamily="Nunito, sans-serif"
          fontWeight="700"
        >
          {t}
        </text>
      ))}

      {/* X-axis labels */}
      {[...xLabelIndices].map(i => (
        <text
          key={i}
          x={xOf(i)}
          y={height - 4}
          textAnchor="middle"
          fontSize="9"
          fill="var(--text-faint)"
          fontFamily="Nunito, sans-serif"
          fontWeight="700"
        >
          {data[i].label}
        </text>
      ))}
    </svg>
  );
}
