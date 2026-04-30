const escapePdfText = (text) =>
  String(text)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const buildPdf = (lines) => {
  const safeLines = lines.map((line) => escapePdfText(line));

  const contentParts = ["BT", "/F1 12 Tf", "50 780 Td", "16 TL"];
  safeLines.forEach((line, index) => {
    if (index === 0) {
      contentParts.push(`(${line}) Tj`);
    } else {
      contentParts.push(`T* (${line}) Tj`);
    }
  });
  contentParts.push("ET");
  const stream = `${contentParts.join("\n")}\n`;

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj\n`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj) => {
    offsets.push(pdf.length);
    pdf += obj;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
};

export const downloadAppointmentPdf = (item) => {
  const vehicleDetails = [item.vehicle, item.brand, item.year].filter(Boolean).join(" / ");
  const requestDateText = item.requestDate ? new Date(item.requestDate).toLocaleString() : "-";
  const appointmentText = item.appointmentDate ? new Date(item.appointmentDate).toLocaleString() : "-";
  const buyerName =
    item.buyerName ||
    item.userId?.name ||
    item.user?.name ||
    item.name ||
    "-";

  const lines = [
    "Vehicle Service Appointment Confirmation",
    "---------------------------------------",
    `Reference ID: ${item._id || "-"}`,
    `Buyer Name: ${buyerName}`,
    `Request Type: ${item.requestType || "-"}`,
    `Service: ${item.serviceName || item.problem || "-"}`,
    `Package Type: ${item.packageType || "-"}`,
    `Problem Description: ${item.problem || "-"}`,
    `Vehicle Details: ${vehicleDetails || "-"}`,
    `Request Date: ${requestDateText}`,
    `Appointment Date & Time: ${appointmentText}`,
    `Appointment Fee: ${item.appointmentFee ? `Rs ${item.appointmentFee}` : "-"}`,
    `Payment Status: ${item.paymentStatus || "-"}`,
    `Approval Status: ${item.status || "-"}`,
    `Provider Note: ${item.note || "-"}`,
    `Generated On: ${new Date().toLocaleString()}`
  ];

  const blob = buildPdf(lines);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `appointment-sheet-${item._id || "request"}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

