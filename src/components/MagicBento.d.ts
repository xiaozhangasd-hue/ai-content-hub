import type { FC, ReactNode } from "react";

export type MagicBentoCard = {
  color?: string;
  title?: string;
  description?: string;
  label?: string;
  href?: string;
  [key: string]: unknown;
};

export interface MagicBentoProps {
  textAutoHide?: boolean;
  enableStars?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  disableAnimations?: boolean;
  spotlightRadius?: number;
  particleCount?: number;
  enableTilt?: boolean;
  glowColor?: string;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
  autoDemo?: boolean;
  autoSpeed?: number;
  autoIntensity?: number;
  takeoverDuration?: number;
  autoResumeDelay?: number;
  autoRampDuration?: number;
  cards?: MagicBentoCard[];
  children?: ReactNode;
  onCardClick?: (card: MagicBentoCard, index: number) => void;
}

declare const MagicBento: FC<MagicBentoProps>;
export default MagicBento;
