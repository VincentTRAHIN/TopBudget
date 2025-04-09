import { useCategories } from "@/hooks/useCategories.hook";
import { useDepenses } from "@/hooks/useDepenses.hook";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PieChartCategories() {
  const { depenses } = useDepenses();
  const { categories } = useCategories();

  const dataParCategorie: { [key: string]: number } = {};

  depenses.forEach((depense) => {
    const catId = typeof depense.categorie === "string" ? depense.categorie : depense.categorie._id;
    dataParCategorie[catId] = (dataParCategorie[catId] || 0) + depense.montant;
  });

  const labels = categories.map((cat) => cat.nom);
  const dataValues = categories.map((cat) => dataParCategorie[cat._id] || 0);

  const data = {
    labels,
    datasets: [
      {
        label: "Dépenses par catégorie",
        data: dataValues,
        backgroundColor: [
          "#3B82F6", "#9333EA", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6"
        ],
      },
    ],
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-center">Répartition par Catégorie</h3>
      <Pie data={data} />
    </div>
  );
}
