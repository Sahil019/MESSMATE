import React from "react";
import "./WasteSummary.css";

const WasteSummary = ({ records }) => {
  const safeRecords = Array.isArray(records) ? records : [];
  const totalServed = safeRecords.reduce((sum, r) => sum + r.total_served, 0);
  const totalConsumed = safeRecords.reduce((sum, r) => sum + r.total_consumed, 0);
  const totalWaste = safeRecords.reduce((sum, r) => sum + r.waste_amount, 0);

  const wastePercentage =
    totalServed > 0 ? ((totalWaste / totalServed) * 100).toFixed(2) : 0;

  return (
    <div className="summary-cards">
      <div className="card">Served: {totalServed}</div>
      <div className="card">Consumed: {totalConsumed}</div>
      <div className="card">Waste: {totalWaste}</div>
      <div
        className={`card ${wastePercentage > 20 ? "danger" : ""}`}
        style={wastePercentage > 20 ? {
          color: '#ef4444',
          fontWeight: '900',
          textShadow: '0 0 12px rgba(239, 68, 68, 0.45)',
          transform: 'translateY(-3px)',
          boxShadow: '0 16px 48px rgba(239, 68, 68, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
        } : {}}
      >
        Waste %: {wastePercentage}%
      </div>
    </div>
  );
};

export default WasteSummary;
