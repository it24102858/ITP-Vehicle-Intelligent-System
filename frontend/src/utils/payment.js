// src/utils/payment.js

import API from "../services/api";

export const payNow = async (item, type, setLoading, setSuccess, refresh) => {
  try {
    setLoading(true);

    await API.post("/payments/pay", {
      id: item._id,
      type,
      amount: item.price || item.packageId?.price,
    });

    setLoading(false);
    setSuccess(true);

    setTimeout(() => {
      setSuccess(false);
      refresh();
    }, 2000);

  } catch (error) {
    console.error(error);
    setLoading(false);
    alert("Payment Failed");
  }
};