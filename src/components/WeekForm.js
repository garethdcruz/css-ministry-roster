import { useState } from "react";
import { makeWeek } from "../types";

export default function WeekForm({ weeks, setWeeks }) {
  const [label, setLabel] = useState("");
  const [date, setDate] = useState("");

  const addWeek = e => {
    e.preventDefault();
    if (!label.trim() || !date) return;
    setWeeks([...weeks, makeWeek(`${date} – ${label}`)]);
    setLabel("");
    setDate("");
  };

  return (
    <form onSubmit={addWeek} style={{ marginBottom: 16 }}>
      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        required
      />
      <input
        placeholder="Label (e.g. wk1 – Welcome)"
        value={label}
        onChange={e => setLabel(e.target.value)}
        required
      />
      <button type="submit">Add Week</button>
    </form>
  );
}