import { FunctionComponent } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  ChartData,
  ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface BarChartProps {
  data: ChartData<"bar">;
}

const options: ChartOptions<"bar"> = {
  plugins: {
    tooltip: {
      enabled: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#A3AAB5",
        font: {
          family: "Lato, sans-serif",
        },
      },
    },
    y: {
      ticks: {
        color: "#A3AAB5",
        font: {
          family: "Lato, sans-serif",
        },
      },
    },
  },
};

const BarChart: FunctionComponent<BarChartProps> = ({ data }) => (
  <Bar data={data} options={options} />
);

export default BarChart;
