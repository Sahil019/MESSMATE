import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const WasteChart = ({ records }) => {
  const safeRecords = Array.isArray(records) ? records : [];
  return (
    <div className="chart-container">
      <h3>Waste Trend Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={safeRecords}>
          <XAxis dataKey="meal_date" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="waste_percentage"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WasteChart;
