import { CoupleFixedCharge } from "@/hooks/useCoupleFixedCharges.hook";
import { DepensesResponse } from "@/hooks/useDepenses.hook";
import fetcher from "@/utils/fetcher.utils";
import debug from "debug";
import { useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { KeyedMutator } from "swr";

import { DataType, DisplayType, TableAction, TableColumn } from "../table/table.types";

export function useColumns() {
  const log = debug("app:frontend:useColumnTableCoupleChargesFixes");

  const columns: TableColumn<CoupleFixedCharge>[] = [
    {
      accessor: "description",
      header: "Description",
      dataType: DataType.STRING,
    },
    {
      accessor: "montant",
      header: "Montant",
      dataType: DataType.NUMBER,
      displayType: DisplayType.CURRENCY,
    },
    {
      accessor: "categorie",
      header: "Catégorie",
      dataType: DataType.STRING,
      // Custom cell rendering to handle both string and object types
      getValue: ({ categorie }) => (typeof categorie === "string" ? categorie : categorie?.nom || "N/A"),
    },
    {
      accessor: "payePar",
      header: "Payé par",
      dataType: DataType.STRING,
    },
  ];

  return {
    columns,
  };
}
