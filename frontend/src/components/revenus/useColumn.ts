import { RevenusResponse } from "@/hooks/useRevenus.hook";
import { revenusEndpoint } from "@/services/api.service";
import { IRevenu } from "@/types/revenu.type";
import fetcher from "@/utils/fetcher.utils";
import debug from "debug";
import toast from "react-hot-toast";
import { KeyedMutator } from "swr";

import { DataType, DisplayType, TableAction, TableColumn } from "../table/table.types";

interface UseColumnsProps {
  currentUserId?: string;
  onEdit: (depense: IRevenu) => void;
  refreshRevenus: KeyedMutator<RevenusResponse>;
}

export function useColumns({ currentUserId, onEdit, refreshRevenus }: UseColumnsProps) {
  const log = debug("app:frontend:useColumnTableRevenus");

  const handleDelete = async (id: string) => {
    if (!confirm("Confirmer la suppression ?")) return;
    try {
      await fetcher(`${revenusEndpoint}/${id}`, {
        method: "DELETE",
      });
      toast.success("Revenu supprimé avec succès !");
      refreshRevenus();
    } catch {
      toast.error("Erreur lors de la suppression du revenu");
    }
  };

  const columns: TableColumn<IRevenu>[] = [
    {
      accessor: "date",
      dataType: DataType.STRING,
      displayType: DisplayType.DATE,
      enableSort: true,
    },
    {
      accessor: "description",
      dataType: DataType.STRING,
      enableSort: true,
    },
    {
      header: "Catégorie",
      accessor: "categorieRevenu",
      dataType: DataType.STRING,
      displayType: DisplayType.ENUM,
      getValue: (row) => row.categorieRevenu.nom || "N/A",
      getSortValue: (row) => row.categorieRevenu.nom || "N/A",
      enableSort: true,
    },
    {
      header: "Récurrent ?",
      accessor: "estRecurrent",
      className: "text-center",
      dataType: DataType.BOOLEAN,
      displayType: DisplayType.ICON,
      getIcon: (row) =>
        row.estRecurrent ? { name: "check", size: 16, color: "green" } : { name: "x", size: 16, color: "red" },
      getSortValue: (row) => (row.estRecurrent ? 1 : 0),
      enableSort: true,
    },
    {
      accessor: "commentaire",
      dataType: DataType.STRING,
      enableSort: true,
    },

    {
      header: "Reçu par",
      accessor: "utilisateur",
      dataType: DataType.STRING,
      getValue: (row) => row.utilisateur.nom,
      getSortValue: (row) => row.utilisateur.nom,
      enableSort: true,
    },

    {
      header: "Compte",
      accessor: "typeCompte",
      dataType: DataType.STRING,
      enableSort: true,
    },
    {
      header: "Montant (€)",
      accessor: "montant",
      dataType: DataType.NUMBER,
      displayType: DisplayType.CURRENCY,
      enableSort: true,
    },
  ];

  // Actions
  const actions: TableAction<IRevenu>[] = [
    {
      header: "Modifier",
      accessor: (row) => row,
      action: (row) => onEdit(row),
      icon: "edit",
      disabled: (row) =>
        currentUserId !== (typeof row.utilisateur === "object" ? row.utilisateur._id : row.utilisateur),
    },
    {
      header: "Supprimer",
      accessor: (row) => row,
      action: (row) => handleDelete(row._id),
      icon: "trash-2",
      color: "red",
      disabled: (row) =>
        currentUserId !== (typeof row.utilisateur === "object" ? row.utilisateur._id : row.utilisateur),
    },
  ];

  return {
    columns,
    actions,
  };
}
