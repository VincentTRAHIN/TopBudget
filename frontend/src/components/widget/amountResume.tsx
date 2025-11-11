import { PaidCharge, UpcomingCharge } from "@/hooks/useUpcomingCharges.hook";
import { DynamicIcon } from "lucide-react/dynamic";
import { useState } from "react";

import { formatCurrency } from "./monthResume";

interface WidgetAmountResumeProps {
  charge: PaidCharge | UpcomingCharge;
  color: string;
  paid?: boolean;
}
export function WidgetAmountResume({ charge, color, paid }: WidgetAmountResumeProps) {
  return (
    <div
      className={`flex items-center justify-between p-3 bg-${color}-50 border border-${color}-200 rounded-lg hover:bg-${color}-100 transition-colors duration-150`}>
      <div className="flex items-center gap-3">
        <div className={`text-${color}-600`}>
          <DynamicIcon name="circle-check-big" size={22} />
        </div>
        <div>
          <p className="font-medium text-gray-800">{charge.description || charge.categorie.nom}</p>
          <p className="text-xs text-gray-500">
            {!paid && "Attendue : "}
            {new Date(charge.date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-800">{formatCurrency(charge.montant)}</p>
      </div>
    </div>
  );
}

interface AmountResumeProps {
  color: string;
  paid: boolean;
  charges: PaidCharge[] | UpcomingCharge[];
  title: string;
}

export function AmountResume({ color, paid, charges, title }: AmountResumeProps) {
  const [showListChargesPaid, setShowListChargesPaid] = useState(false);

  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wide">
        {title}
        <button
          className="ml-3 text-xs text-indigo-600 hover:underline"
          onClick={() => setShowListChargesPaid(!showListChargesPaid)}>
          <DynamicIcon
            name={showListChargesPaid ? "chevrons-up" : "chevrons-down"}
            size={20}
            className="inline-block"
          />
        </button>
      </h4>
      {showListChargesPaid && (
        <div className="space-y-2">
          {charges.map((charge: PaidCharge | UpcomingCharge, index: number) => (
            <WidgetAmountResume key={index} charge={charge} color={color} paid={paid} />
          ))}
        </div>
      )}
    </div>
  );
}
