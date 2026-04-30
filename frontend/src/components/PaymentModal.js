import React, { useState } from "react";
import "./PaymentModal.css";

const PaymentModal = ({ isOpen, onClose, onConfirm, amount }) => {
  const [card, setCard] = useState({
    name: "",
    number: "",
    expiry: "",
    cvv: ""
  });

  if (!isOpen) return null;

  // FORMAT CARD NUMBER (1234 5678 9012 3456)
  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 16);
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(" ") : "";
  };

  // FORMAT EXPIRY (MM/YY)
  const formatExpiry = (value) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);

    if (cleaned.length <= 2) return cleaned;

    return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "number") {
      setCard({ ...card, number: formatCardNumber(value) });
    } else if (name === "expiry") {
      setCard({ ...card, expiry: formatExpiry(value) });
    } else if (name === "cvv") {
      const cleaned = value.replace(/\D/g, "").slice(0, 3);
      setCard({ ...card, cvv: cleaned });
    } else {
      setCard({ ...card, [name]: value });
    }
  };

  const handleSubmit = () => {
    const { name, number, expiry, cvv } = card;
    const cleanNumber = number.replace(/\s/g, "");

    // Empty validation
    if (!name || !cleanNumber || !expiry || !cvv) {
      return alert("Fill all payment details");
    }

    //  Name validation
    if (!/^[A-Za-z ]{3,}$/.test(name)) {
      return alert("Enter a valid card holder name");
    }

    //  Card number validation
    if (!/^\d{16}$/.test(cleanNumber)) {
      return alert("Card number must be 16 digits");
    }

    //  Expiry format validation
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
      return alert("Enter valid expiry (MM/YY)");
    }

    //  Expiry logic validation (not past)
    const [month, year] = expiry.split("/");
    const currentDate = new Date();

    const expMonth = parseInt(month);
    const expYear = parseInt(`20${year}`);

    const expiryDate = new Date(expYear, expMonth); // next month start

    if (expiryDate <= currentDate) {
      return alert("Card has expired");
    }

    //  CVV validation
    if (!/^\d{3}$/.test(cvv)) {
      return alert("CVV must be 3 digits");
    }

    // SUCCESS
    onConfirm();
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">

        <h2>💳 Pay Appointment Fee</h2>
        <p>Amount: <strong>Rs: {amount}</strong></p>

        <input
          name="name"
          placeholder="Card Holder Name"
          onChange={handleChange}
        />

        <input
          name="number"
          placeholder="1234 5678 9012 3456"
          value={card.number}
          onChange={handleChange}
        />

        <input
          name="expiry"
          placeholder="MM/YY"
          value={card.expiry}
          onChange={handleChange}
        />

        <input
          name="cvv"
          placeholder="CVV"
          value={card.cvv}
          onChange={handleChange}
        />

        <div className="payment-actions">
          <button className="pay-btn" onClick={handleSubmit}>
            Pay Now
          </button>

          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};

export default PaymentModal;
