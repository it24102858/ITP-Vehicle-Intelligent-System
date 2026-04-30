
import React from "react";

const NormalCard = ({ service, onApply }) => {
  return (
    <div className="ncard">
      <h3>{service.name}</h3>
      <p>Price: Rs.{service.price}</p>
      <p>Duration: {service.duration}</p>
      <p>Notice: {service.description}</p>
      <button onClick={() => onApply(service)}><b>Book</b></button>
    </div>
  );
};

export default NormalCard;
