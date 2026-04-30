import React, { useState } from "react";

const RequestForm = ({ onSubmit }) => {
  const [form, setForm] = useState({
    problem: "",
    vehicle: "",
    brand: "",
    year: ""
  });

  const [errors, setErrors] = useState({});

  // Handle input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" }); // clear error on change
  };

  // Generate a unique random ID (can be replaced with backend-generated IDs if needed)
  const generateId = () => {
    return Date.now() + Math.floor(Math.random() * 1000);
  };

  // Handle submit
  const handleSubmit = () => {
    const newErrors = {};

    // Validation
    if (!form.problem.trim()) newErrors.problem = "Problem description is required";
    if (!form.vehicle.trim()) newErrors.vehicle = "Vehicle type is required";
    if (!form.brand.trim()) newErrors.brand = "Brand is required";
    const validateYear = (year) => {
  const currentYear = new Date().getFullYear();
  if (!year.trim()) return "Year is required";
  if (!/^\d{4}$/.test(year)) return "Year must be 4 digits";
  const numYear = Number(year);
  if (numYear < 1900 || numYear > currentYear) 
    return `Year must be between 1900 and ${currentYear}`;
  return "";
};

// Usage in your form validation:

const yearError = validateYear(form.year);
if (yearError) newErrors.year = yearError;

if (Object.keys(newErrors).length > 0) {
  setErrors(newErrors);
  return; // stop submission
}

    // Create request object with unique ID
    const requestData = {
      ...form,
      id: generateId(), // local unique ID
      requestDate: new Date(),
      status: "Pending"
    };

    onSubmit(requestData);

    // Clear form
    setForm({ problem: "", vehicle: "", brand: "", year: "" });
  };

  return (
    <div className="request-form">
      <h3>Custom Service Request</h3>

      <div>
        <input
          name="problem"
          placeholder="Describe problem"
          value={form.problem}
          onChange={handleChange}
        />
        {errors.problem && <span className="error">{errors.problem}</span>}
      </div>

      <div>
        <input
          name="vehicle"
          placeholder="Vehicle type"
          value={form.vehicle}
          onChange={handleChange}
        />
        {errors.vehicle && <span className="error">{errors.vehicle}</span>}
      </div>

      <div>
        <input
          name="brand"
          placeholder="Brand"
          value={form.brand}
          onChange={handleChange}
        />
        {errors.brand && <span className="error">{errors.brand}</span>}
      </div>

      <div>
        <input
          name="year"
          placeholder="Year"
          value={form.year}
          onChange={handleChange}
        />
        {errors.year && <span className="error">{errors.year}</span>}
      </div>

      <button onClick={handleSubmit}>Submit</button>

      <style jsx>{`
        .request-form {
          margin: 20px 0;
          padding: 15px;
          border: 1px solid #000000;
          border-radius: 8px;
          background: #f9f9f9;
        }
        input {
          display: block;
          width: 100%;
          margin-bottom: 5px;
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #000000;
        }
        button {
          padding: 8px 15px;
          background: #487ab7;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background: #45a049;
        }
        .error {
          color: red;
          font-size: 12px;
          margin-bottom: 10px;
          display: block;
        }
      `}</style>
    </div>
  );
};

export default RequestForm;