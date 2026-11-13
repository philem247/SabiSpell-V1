export default function Wordmark({ size = 32 }: { size?: number }) {
  return (
    <span className="font-sans font-extrabold leading-none" style={{ fontSize: size }}>
      <span className="text-brand-600">Sabi</span>
      <span className="text-gold-600">Spell</span>
    </span>
  );
}
