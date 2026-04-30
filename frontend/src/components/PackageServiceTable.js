import React from "react";

const PackageServiceTable = ({ data = [], onDelete, onPay, onDownloadPdf }) => {
  return (
    <div className="service-table">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Service Package</th>
            <th>Package Type</th>
            <th>Request Date</th>
            <th>Appointment</th>
            <th>Appointment Fee</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: "center" }}>
                No Data Available
              </td>
            </tr>
          ) : (
            data.map((item, index) => {
              const id = item._id || item.id;

              let status = "Pending";
              if (item.status === "Rejected") status = "Rejected";
              else if (item.status === "Approved") status = "Approved";
              else if (
                item.status === "Waiting Payment" &&
                item.paymentStatus !== "Paid"
              ) {
                status = "Waiting Payment";
              } else if (item.paymentStatus === "Paid") {
                status = "Paid";
              }
            

              return (
                <tr key={id}>
                  <td>{index + 1}</td>
                  <td>{item.serviceName || item.problem || "-"}</td>
                  <td>{item.packageType || item.type || "-"}</td>
                  <td>
                    {item.requestDate
                      ? new Date(item.requestDate).toLocaleString()
                      : "-"}
                  </td>
                  <td>
                    {item.appointmentDate
                      ? new Date(item.appointmentDate).toLocaleString()
                      : "Not Scheduled"}
                  </td>
                  <td>{item.appointmentFee ? `Rs ${item.appointmentFee}` : "Not Set"}</td>
                  <td>{status}</td>
                  <td>
                    {onPay &&
                      item.appointmentFee &&
                      item.paymentStatus !== "Paid" &&
                      item.status !== "Rejected" && (
                        <button className="pay-btn" onClick={() => onPay(item)}>
                          Pay
                        </button>
                      )}

                    {onDownloadPdf &&
                      item.status === "Approved" &&
                      item.paymentStatus === "Paid" && (
                        <button
                          className="pdf-btn"
                          onClick={() => onDownloadPdf(item)}
                        >
                          Download PDF
                        </button>
                      )}

                    {item.status !== "Approved" && (
                      <button className="delete-btn" onClick={() => onDelete(id)}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <style jsx>{`
        .service-table {
          overflow-x: auto;
          margin-bottom: 30px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th,
        td {
          padding: 10px;
          border: 1px solid #ddd;
        }

        th {
          background: #1e1e2f;
          color: white;
        }

        tr:nth-child(even) {
          background: #f5f5f5;
        }

        button {
          padding: 6px 10px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 5px;
        }

        .delete-btn {
          background: #f44336;
          color: white;
        }

        .pay-btn {
          background: #28a745;
          color: white;
        }

        .pdf-btn {
          background: #2563eb;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default PackageServiceTable;
