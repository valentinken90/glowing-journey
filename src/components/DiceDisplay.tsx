// Dice dot positions in a 3×3 grid (0=TL, 1=TC, 2=TR, 3=ML, 4=MC, 5=MR, 6=BL, 7=BC, 8=BR)
const DICE_FACE: Record<number, number[]> = {
  0: [],
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const TWO_DICE: Record<number, [number, number]> = {
  7: [3, 4], 8: [4, 4], 9: [4, 5],
  10: [5, 5], 11: [5, 6], 12: [6, 6],
};

// Fun palette — one color per dice face / dot group
const DICE_COLORS = [
  '#FF6058', '#FFB800', '#00BFA5', '#9B59D0',
  '#3B82F6', '#22C55E', '#FF8C00', '#F43F5E',
];

function diceFaceColor(n: number): string {
  return DICE_COLORS[(n - 1 + DICE_COLORS.length) % DICE_COLORS.length];
}

interface SingleDiceProps {
  n: number;
  size?: number;
  color?: string;
}

function SingleDice({ n, size = 80, color }: SingleDiceProps) {
  const dots = DICE_FACE[Math.min(Math.max(0, n), 6)] ?? [];
  const dotColor = color ?? diceFaceColor(n);

  return (
    <div
      style={{
        width: size,
        height: size,
        background: '#fff',
        border: `${Math.max(2, size * 0.04)}px solid #E5E7EB`,
        borderRadius: size * 0.18,
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        padding: size * 0.1,
        gap: size * 0.04,
        flexShrink: 0,
      }}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <div
          key={i}
          style={{
            borderRadius: '50%',
            background: dots.includes(i) ? dotColor : 'transparent',
            transition: 'background 0.1s',
          }}
        />
      ))}
    </div>
  );
}

interface DiceDisplayProps {
  value: number;
}

export default function DiceDisplay({ value }: DiceDisplayProps) {
  const n = Math.min(Math.max(0, Math.round(value)), 20);

  if (n <= 6) {
    return <SingleDice n={n} size={90} />;
  }

  if (n <= 12) {
    const [a, b] = TWO_DICE[n];
    return (
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
        <SingleDice n={a} size={68} color={DICE_COLORS[0]} />
        <span style={{ fontSize: 18, color: 'var(--text-muted)', fontWeight: 700 }}>+</span>
        <SingleDice n={b} size={68} color={DICE_COLORS[2]} />
      </div>
    );
  }

  // 13–20: rows of colored dots grouped in 5s
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        justifyContent: 'center',
        maxWidth: 180,
      }}
    >
      {Array.from({ length: n }, (_, i) => (
        <div
          key={i}
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: DICE_COLORS[Math.floor(i / 5) % DICE_COLORS.length],
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}
