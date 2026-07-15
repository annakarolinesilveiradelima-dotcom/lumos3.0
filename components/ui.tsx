import type { ButtonHTMLAttributes, ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
type CardProps = HTMLMotionProps<"div"> & { children?: ReactNode };
export function Card({ className, children, ...props }: CardProps) {
  return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className={cn("glass rounded-3xl p-5", className)} {...props}>{children}</motion.div>;
}
export function Panel({ className, children, ...props }: CardProps) {
  return <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }} className={cn("glass-strong rounded-[2rem] p-6", className)} {...props}>{children}</motion.div>;
}
export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-xs text-parchment", className)}>{children}</span>;
}
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;
export function Button({ className, children, ...props }: ButtonProps) {
  return <button className={cn("focus-ring rounded-2xl bg-gold px-4 py-2 font-semibold text-ink shadow-glow transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50", className)} {...props}>{children}</button>;
}
