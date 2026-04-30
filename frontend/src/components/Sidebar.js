import React from "react";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <h2>Vehicle Service</h2>
        <ul>
          <li>Dashboard</li>
          <li>Service Packages</li>
          <li>Requests</li>
          <li>Appointments</li>
          <li>Settings</li>
        </ul>
      </div>

      <style jsx>{`
        .sidebar {
          width: 220px;
          background: #29243c;
          color: white;
          min-height: 100vh;
          height: auto;
          overflow-y: auto; /* scroll inside if content exceeds height */
          flex-shrink: 0;
        }

        .sidebar-content {
          padding: 20px;
        }

        h2 {
          font-size: 1.5rem;
          margin-bottom: 20px;
        }

        ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        li {
          padding: 12px 0;
          cursor: pointer;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          transition: background 0.2s;
        }

        li:hover {
          background: rgba(234, 234, 234, 0.1);
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
