/**
 * Déclarations de types pour lucide-react
 * Permet d'utiliser les icônes sans erreur TypeScript
 */
declare module "lucide-react" {
  import { FC, SVGProps } from "react";

  export interface LucideProps extends Partial<SVGProps<SVGSVGElement>> {
    size?: string | number;
    absoluteStrokeWidth?: boolean;
    color?: string;
    strokeWidth?: string | number;
  }

  export type LucideIcon = FC<LucideProps>;

  export const Activity: LucideIcon;
  export const ArrowDownRight: LucideIcon;
  export const ArrowUpRight: LucideIcon;
  export const Calendar: LucideIcon;
  export const DollarSign: LucideIcon;
  export const HelpCircle: LucideIcon;
  export const Minus: LucideIcon;
  export const TrendingDown: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const User: LucideIcon;
  export const Users: LucideIcon;
}
