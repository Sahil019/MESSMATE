import React, { useEffect, useState } from "react";
import WasteSummary from "./WasteSummary";
import WasteChart from "./WasteChart";
import WasteTable from "./WasteTable";
import { api } from "@/api";
import "./WasteAnalyser.css";

const WasteAnalyser = () => {
  const [records, setRecords] = useState([]);
  const [mealType, setMealType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState("");
  const [newRecord, setNewRecord] = useState({
    meal_date: "",
    meal_type: "lunch",
    total_served: "",
    total_consumed: "",
    waste_amount: "",
    waste_percentage: "",
    notes: ""
  });

  const fetchWasteData = async () => {
    try {
      setLoading(true);

      const query = new URLSearchParams();
      if (startDate) query.append("startDate", startDate);
      if (endDate) query.append("endDate", endDate);
      if (mealType && mealType !== "all") query.append("mealType", mealType);

      const res = await api(`/api/admin/waste?${query.toString()}`);

      console.log("WASTE API RESPONSE:", res);

      setRecords(res.records || []);
    } catch (err) {
      console.error("Failed to fetch waste data", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateWaste = (served, consumed) => {
    if (!served || !consumed) return { amount: 0, percentage: 0 };
    const amount = served - consumed;
    const percentage = served > 0 ? ((amount / served) * 100).toFixed(2) : 0;
    return { amount, percentage };
  };

  const handleInputChange = (field, value) => {
    const updatedRecord = { ...newRecord, [field]: value };

    // Auto-calculate waste when served or consumed changes
    if (field === 'total_served' || field === 'total_consumed') {
      const served = field === 'total_served' ? parseInt(value) || 0 : parseInt(newRecord.total_served) || 0;
      const consumed = field === 'total_consumed' ? parseInt(value) || 0 : parseInt(newRecord.total_consumed) || 0;

      if (served >= consumed) {
        const { amount, percentage } = calculateWaste(served, consumed);
        updatedRecord.waste_amount = amount.toString();
        updatedRecord.waste_percentage = percentage.toString();
      }
    }

    setNewRecord(updatedRecord);
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    const served = parseInt(newRecord.total_served) || 0;
    const consumed = parseInt(newRecord.total_consumed) || 0;

    if (consumed > served) {
      setError("Total consumed cannot exceed total served");
      return;
    }

    if (!newRecord.meal_date || !newRecord.meal_type) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      const recordToSubmit = {
        ...newRecord,
        total_served: served,
        total_consumed: consumed,
        waste_amount: parseInt(newRecord.waste_amount) || 0,
        waste_percentage: parseFloat(newRecord.waste_percentage) || 0
      };

      await api('/api/admin/waste', {
        method: 'POST',
        body: JSON.stringify(recordToSubmit)
      });

      setNewRecord({
        meal_date: "",
        meal_type: "lunch",
        total_served: "",
        total_consumed: "",
        waste_amount: "",
        waste_percentage: "",
        notes: ""
      });
      setShowAddForm(false);
      fetchWasteData(); // Refresh data
    } catch (err) {
      console.error("Failed to add waste record", err);
      if (err.status === 409) {
        setError("A record for this date and meal type already exists");
      } else {
        setError("Failed to add waste record. Please try again.");
      }
    }
  };

  useEffect(() => {
    fetchWasteData();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Waste Analyser</h1>
        <p className="page-description">
          Analyze food waste and identify operational failures.
        </p>
      </div>

      {/* Filters */}
      <div className="filters">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

        <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
          <option value="all">All Meals</option>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
        </select>
        
        <button onClick={fetchWasteData} className="filters-button">Apply</button>
        <button onClick={() => setShowAddForm(!showAddForm)} className="filters-button">
          {showAddForm ? "Cancel" : "Add Waste Record"}
        </button>
      </div>

      {/* Add Record Modal */}
      {showAddForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add New Waste Record</h3>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleAddRecord}>
              <div className="form-row">
                <label>Date:</label>
                <input
                  type="date"
                  value={newRecord.meal_date}
                  onChange={(e) => setNewRecord({...newRecord, meal_date: e.target.value})}
                  required
                />
              </div>
              <div className="form-row">
                <label>Meal Type:</label>
                <select
                  value={newRecord.meal_type}
                  onChange={(e) => setNewRecord({...newRecord, meal_type: e.target.value})}
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>
              <div className="form-row">
                <label>Total Served:</label>
                <input
                  type="number"
                  value={newRecord.total_served}
                  onChange={(e) => handleInputChange('total_served', e.target.value)}
                  required
                  min="0"
                  placeholder="Enter total served"
                />
              </div>
              <div className="form-row">
                <label>Total Consumed:</label>
                <input
                  type="number"
                  value={newRecord.total_consumed}
                  onChange={(e) => handleInputChange('total_consumed', e.target.value)}
                  required
                  min="0"
                  placeholder="Enter total consumed"
                />
              </div>
              <div className="form-row">
                <label>Waste Amount:</label>
                <input
                  type="number"
                  value={newRecord.waste_amount}
                  onChange={(e) => setNewRecord({...newRecord, waste_amount: e.target.value})}
                  required
                  min="0"
                  placeholder="Auto-calculated"
                  readOnly
                />
              </div>
              <div className="form-row">
                <label>Waste Percentage:</label>
                <input
                  type="number"
                  step="0.01"
                  value={newRecord.waste_percentage}
                  onChange={(e) => setNewRecord({...newRecord, waste_percentage: e.target.value})}
                  required
                  min="0"
                  max="100"
                  placeholder="Auto-calculated"
                  readOnly
                />
              </div>
              <div className="form-row">
                <label>Notes (Optional):</label>
                <textarea
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord({...newRecord, notes: e.target.value})}
                  placeholder="Additional notes about the waste..."
                  rows="3"
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit">Add Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <WasteSummary records={records} />
          <WasteChart records={records} />
          <WasteTable records={records} />
        </>
      )}
    </div>
  );
};

export default WasteAnalyser;
