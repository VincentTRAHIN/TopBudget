import { ChartOptions } from "chart.js";
import { Line } from "react-chartjs-2";

interface SparklineData {
  labels: string[];
  datasets: {
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
    tension: number;
  }[];
}

export function WidgetSparkGraph({ data }: { data: SparklineData }) {
  const sparklineOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => `${(context.parsed.y || 0).toFixed(2)}€`,
        },
      },
    },
    scales: {
      x: {
        display: true,
      },
      y: {
        display: true,
      },
    },
    elements: {
      line: {
        borderWidth: 2,
      },
    },
  };

  return (
    <div className="pt-4 border-t border-gray-200">
      <p className="text-sm font-medium text-gray-600 mb-3">Évolution du solde</p>
      <div className="h-20">
        <Line data={data} options={sparklineOptions} />
      </div>
    </div>
  );
}
