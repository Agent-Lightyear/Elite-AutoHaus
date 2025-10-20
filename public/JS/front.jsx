// CustomizeCar.jsx
import { useState } from "react";

export default function CustomizeCar() {
  const [carModel, setCarModel] = useState("");
  const [style, setStyle] = useState("");
  const [budget, setBudget] = useState("");
  const [suggestions, setSuggestions] = useState("");

  const handleCustomize = async () => {
    const res = await fetch("/api/customize-car", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ carModel, style, budget }),
    });

    const data = await res.json();
    setSuggestions(data.suggestions);
  };

  return (
    <div className="customize-car">
      <input placeholder="Car Model" value={carModel} onChange={e => setCarModel(e.target.value)} />
      <input placeholder="Style (Sport, Luxury, etc.)" value={style} onChange={e => setStyle(e.target.value)} />
      <input placeholder="Budget" value={budget} onChange={e => setBudget(e.target.value)} />
      <button onClick={handleCustomize}>Get Suggestions</button>

      {suggestions && (
        <div className="suggestions">
          <h3>Customization Suggestions:</h3>
          <p>{suggestions}</p>
        </div>
      )}
    </div>
  );
}
