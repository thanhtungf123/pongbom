// Ô "Sắp có" để lưới trông đầy giống mirror (chưa phải game chơi được)
const ICONS = ["🎮", "🚗", "⚽", "🧩", "👾", "🏎️", "🎯", "🪄"];

export default function PlaceholderCard({ seed }: { seed: number }) {
  return (
    <li>
      <div className="image ph">
        <span>{ICONS[seed % ICONS.length]}</span>
      </div>
      <div className="title ph">Sắp có</div>
    </li>
  );
}
