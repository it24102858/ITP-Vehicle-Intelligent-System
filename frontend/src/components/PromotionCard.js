import React from "react";

const PromotionCard = ({ service, onApply }) => {
  return (
    <div className="pcard">
      <div className="card-content"></div>
      <h3>{service.name}</h3>
      <p>Original Price: Rs.{service.price}</p>
      <p className="discount-price">Discount Price:Rs.{service.finalPrice}</p>

      <p>Duration: {service.duration}</p>
      <p>Topic: {service.promotionTopic || "-"}</p>
      <p>
        Period:{" "}
        {service.promotionStartDate && service.promotionEndDate
          ? `${new Date(service.promotionStartDate).toLocaleDateString()} - ${new Date(service.promotionEndDate).toLocaleDateString()}`
          : "-"}
      </p>
      <button onClick={() => onApply(service)}>Book</button>
    </div>
  );
};


export default PromotionCard;
