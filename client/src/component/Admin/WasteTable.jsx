import React from "react";

const WasteTable = ({ records }) => {
  const safeRecords = Array.isArray(records) ? records : [];
  return (
    <table className="waste-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Meal</th>
          <th>Served</th>
          <th>Consumed</th>
          <th>Waste</th>
          <th>Waste %</th>
        </tr>
      </thead>
      <tbody>
        {safeRecords.map((r, i) => (
          <tr key={i}>
            <td>{r.meal_date}</td>
            <td>{r.meal_type}</td>
            <td>{r.total_served}</td>
            <td>{r.total_consumed}</td>
            <td>{r.waste_amount}</td>
            <td>{r.waste_percentage}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default WasteTable;
