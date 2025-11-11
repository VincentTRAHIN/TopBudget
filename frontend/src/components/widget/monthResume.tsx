import { DynamicIcon, IconName } from "lucide-react/dynamic";

interface WidgetMonthResumeProps {
  title: string;
  amount: number;
  variationAmount: number;
  color: string;
}

interface ValueVariation {
  text: string;
  icon: IconName;
  symbol: string;
}

export function WidgetMonthResume({ title, amount, variationAmount, color }: WidgetMonthResumeProps) {
  const valueVariation: ValueVariation = {
    text: variationAmount >= 0 ? "text-green-600" : "text-red-600",
    icon: variationAmount >= 0 ? "trending-up" : "trending-down",
    symbol: variationAmount >= 0 ? "+" : "",
  };
  return (
    <div className={`flex items-center justify-between p-4 bg-${color}-50 border border-${color}-200 rounded-lg`}>
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-2xl font-bold text-${color}-600`}>{formatCurrency(amount)}</p>
      </div>
      <div className="text-right">
        <div className={`flex items-center gap-1 text-sm font-medium ${valueVariation.text}`}>
          <DynamicIcon name={valueVariation.icon} />
          <span>
            {valueVariation.symbol}
            {formatCurrency(variationAmount)}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">vs mois précédent</p>
      </div>
    </div>
  );
}

export const formatCurrency = (amount: number): string => {
  return `${amount.toFixed(2)}€`;
};
