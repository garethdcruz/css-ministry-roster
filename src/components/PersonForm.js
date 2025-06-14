import { useState } from "react";
import { makePerson } from "../types";

export default function PersonForm({ people, setPeople }) {
  const [name, setName] = useState("");

  const addPerson = e => {
    e.preventDefault();
    if (!name.trim()) return;
    setPeople([...people, makePerson(name)]);
    setName("");;
  };

  return (
    <form onSubmit={addPerson} style={{ marginBottom: 16 }}>
      <input
        placeholder="Name"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      <button type="submit">Add Person</button>
    </form>
  );
}