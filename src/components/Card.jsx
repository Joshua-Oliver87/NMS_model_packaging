import React from "react";

export const Card = ({ title, description, count, children, onAddClick }) => (
    <div className="card">
      <div className="card-header">
        <div className="header-content">
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
        {count !== undefined && <span className="count">{count}</span>}
        <button className="add-button" onClick={onAddClick}>+</button>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );