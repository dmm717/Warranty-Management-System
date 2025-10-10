import React from "react";
import "./StatsCard.css";

function StatsCard({ title, value, icon, color }) {
  return (
    <div className={`stats-card stats-card-${color}`}>
      <div className="stats-card-content">
        <div className="stats-card-header">
          <h3 className="stats-card-title">{title}</h3>
          <div className="stats-card-icon">{icon}</div>
        </div>
        <div className="stats-card-value">{value}</div>
      </div>
      <div className={`stats-card-accent stats-card-accent-${color}`}></div>
    </div>
  );
}

export default StatsCard;
