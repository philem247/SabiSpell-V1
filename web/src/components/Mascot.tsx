import standard from '../assets/brand/ajala-standard.svg';
import happy from '../assets/brand/ajala-happy.svg';
import sad from '../assets/brand/ajala-sad.svg';
import streak from '../assets/brand/ajala-streak.svg';
import graduation from '../assets/brand/ajala-graduation.svg';

const POSES = {
  standard: { src: standard, alt: 'Ajala the owl' },
  happy: { src: happy, alt: 'Ajala the owl, happy' },
  sad: { src: sad, alt: 'Ajala the owl, sad' },
  streak: { src: streak, alt: 'Ajala the owl on a hot streak' },
  graduation: { src: graduation, alt: 'Ajala the owl in a graduation cap' },
};

export type MascotPose = keyof typeof POSES;

export default function Mascot({
  pose = 'standard',
  size = 160,
  className,
}: {
  pose?: MascotPose;
  size?: number;
  className?: string;
}) {
  const { src, alt } = POSES[pose];
  return <img src={src} alt={alt} width={size} height={size} className={className} />;
}
