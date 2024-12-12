import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const SemiCircleGauge = ({ value, max, title, color }) => {
  const percentage = Math.min(100, (value / max) * 100);

  return (
    <div className="flex flex-col items-center">
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="relative w-24 h-12 overflow-hidden">
        <div className="absolute w-24 h-24 bg-gray-200 rounded-full top-12"></div>
        <div
          className="absolute w-24 h-24 rounded-full top-12 transition-all duration-500"
          style={{
            background: `conic-gradient(${color} ${percentage}%, transparent ${percentage}%)`,
            transform: "rotate(-90deg)",
          }}
        ></div>
        <div className="absolute w-20 h-20 rounded-full top-14 left-2"></div>
        <div className="absolute w-full text-center top-4 text-sm font-bold">
          {value.toFixed(3)}
        </div>
      </div>
    </div>
  );
};

function DashboardPage() {
  const [timeDuration, setTimeDuration] = useState(30);
  const [isFetching, setIsFetching] = useState(false);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [baselineValues, setBaselineValues] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Function to generate randomized data with a slope
  const generateRandomData = (step) => {
    const uts = 11 + (step * 0.01) + (Math.random() * 0.2 - 0.1); // Slope + Random offset
    const conductivity = 60 + (step * 0.02) + (Math.random() * 0.4 - 0.2); // Slope + Random offset
    const elongation = 20 + (step * 0.03) + (Math.random() * 0.4 - 0.2); // Slope + Random offset

    return { uts, conductivity, elongation };
  };

  useEffect(() => {
    let interval;
    if (isFetching) {
      interval = setInterval(() => {
        const currentData = generateRandomData(currentStep);
        setCurrentStep((prevStep) => prevStep + 1);

        if (!baselineValues) {
          setBaselineValues(currentData);
        }

        if (baselineValues) {
          const relativeData = {
            uts:
              ((currentData.uts - baselineValues.uts) / baselineValues.uts) * 100,
            conductivity:
              ((currentData.conductivity - baselineValues.conductivity) /
                baselineValues.conductivity) *
              100,
            elongation:
              ((currentData.elongation - baselineValues.elongation) /
                baselineValues.elongation) *
              100,
            time: timeSeriesData.length + 1,
            originalUts: currentData.uts,
            originalConductivity: currentData.conductivity,
            originalElongation: currentData.elongation,
          };

          setTimeSeriesData((prevData) => {
            const updatedData = [...prevData, relativeData];
            return updatedData.slice(-12); // Keep the last 12 data points
          });
        }
      }, 2000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isFetching, baselineValues, timeSeriesData, currentStep]);

  const filteredData = timeSeriesData.filter(
    (item) => item.time <= timeDuration
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-4 border rounded shadow">
          <p className="text-sm font-bold">Time: {label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {" "}
              {entry.payload[
                `original${
                  entry.name.charAt(0).toUpperCase() + entry.name.slice(1)
                }`
              ].toFixed(6)}
              <span className="ml-2">({entry.value.toFixed(4)}% change)</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-lg shadow-md p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-4">
            Material Properties Time Series (% Change from Baseline)
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Duration: {timeDuration}
            </label>
            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={timeDuration}
              onChange={(e) => setTimeDuration(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  label={{ value: "Time", position: "bottom" }}
                />
                <YAxis
                  label={{
                    value: "% Change from Baseline",
                    angle: -90,
                    position: "left",
                  }}
                  domain={[-10, 10]}
                  tickFormatter={(value) => value.toFixed(3) + "%"}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="elongation"
                  stroke="#4ade80"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="elongation"
                />
                <Line
                  type="monotone"
                  dataKey="conductivity"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="conductivity"
                />
                <Line
                  type="monotone"
                  dataKey="uts"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="uts"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Current Values</h2>
        <div className="flex justify-around">
          <SemiCircleGauge
            value={
              timeSeriesData.length > 0
                ? timeSeriesData[timeSeriesData.length - 1].originalElongation
                : 0
            }
            max={100}
            title="Elongation"
            color="#4ade80"
          />
          <SemiCircleGauge
            value={
              timeSeriesData.length > 0
                ? timeSeriesData[timeSeriesData.length - 1].originalConductivity
                : 0
            }
            max={100}
            title="Conductivity"
            color="#f43f5e"
          />
          <SemiCircleGauge
            value={
              timeSeriesData.length > 0
                ? timeSeriesData[timeSeriesData.length - 1].originalUts
                : 0
            }
            max={20}
            title="UTS"
            color="#3b82f6"
          />
        </div>
      </div>

      <button
        className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-600 transition-colors"
        onClick={() => {
          if (!isFetching) {
            setBaselineValues(null);
          }
          setIsFetching(!isFetching);
        }}
      >
        {isFetching ? "Stop" : "Start"} Data Updates
      </button>
    </div>
  );
}

export default DashboardPage;
