import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number };

const iconProps = (props: IconProps) => {
  const { size = 24, strokeWidth = 2, ...rest } = props;
  return { width: size, height: size, strokeWidth, stroke: "currentColor", fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, ...rest };
};

export function Home(props: IconProps) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" {...iconProps(props)}><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></svg>;
}

export function Utensils(props: IconProps) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" {...iconProps(props)}><path d="M7 3v8" /><path d="M4 3v5a3 3 0 0 0 6 0V3" /><path d="M7 11v10" /><path d="M17 3v18" /><path d="M17 3c2 1.1 3 3.1 3 5.3V12h-3" /></svg>;
}

export function Recycle(props: IconProps) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" {...iconProps(props)}><path d="m7 7-2 3 2 3" /><path d="M5 10h8" /><path d="m17 17 2-3-2-3" /><path d="M19 14h-8" /><path d="m13 5-3-2-3 2" /><path d="M10 3l4 7" /><path d="m11 19 3 2 3-2" /><path d="M14 21l-4-7" /></svg>;
}

export function CalendarDays(props: IconProps) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" {...iconProps(props)}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></svg>;
}

export function Trophy(props: IconProps) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" {...iconProps(props)}><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" /><path d="M8 5H4v2a4 4 0 0 0 4 4M16 5h4v2a4 4 0 0 1-4 4" /><path d="M12 12v5M8 21h8M10 17h4" /></svg>;
}

export function MessageCircle(props: IconProps) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" {...iconProps(props)}><path d="M20 11.5a8.4 8.4 0 0 1-9 8.5 9.8 9.8 0 0 1-4-.8L3 20l1-3.5A8.3 8.3 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 8 8.5Z" /><path d="M8 11h.01M12 11h.01M16 11h.01" /></svg>;
}

export function Download(props: IconProps) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" {...iconProps(props)}><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M4 21h16" /></svg>;
}
