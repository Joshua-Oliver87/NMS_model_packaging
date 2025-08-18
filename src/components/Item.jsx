import React from "react";

export const Item = ({ name, value }) => (
    <div className="item">
      <div>
        <strong>{name}</strong>
      </div>
      <div>
        <span>{value}</span>
      </div>
    </div>
  );