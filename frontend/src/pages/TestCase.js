import React, { useState } from 'react';
import './TestCases.css';

const FRONTEND_TESTS = [
  { suite: 'Navigation & Role Selection', tests: [
    { id: 'F-1.1', scenario: 'Temp Home routing', steps: 'Navigate to / and Click Enter Customer Portal', expected: 'Redirects to /client/my-deliveries' },
    { id: 'F-1.2', scenario: 'Admin Dashboard routing', steps: 'Navigate to / and Click Enter Admin Dashboard', expected: 'Redirects to /admin/dashboard' },
    { id: 'F-1.3', scenario: 'Navbar Dynamic Rendering', steps: 'Visit Client page vs Admin page', expected: 'Shows Customer or Admin badge accordingly' }
  ]},
  { suite: 'Client - Delivery Creation', tests: [
    { id: 'F-2.1', scenario: 'Form Validation', steps: 'Submit empty fields', expected: 'HTML5 validation prevents submission' },
    { id: 'F-2.2', scenario: 'Successful Creation', steps: 'Fill all required fields and submit', expected: 'Shows Success View with ID' },
    { id: 'F-2.3', scenario: 'Post-creation track button', steps: 'Click "Track This Delivery"', expected: 'Redirects to /client/track/:id' }
  ]},
  { suite: 'Client - My Deliveries', tests: [
    { id: 'F-3.1', scenario: 'Empty Search', steps: 'Search non-existent name', expected: 'Empty state is shown' },
    { id: 'F-3.2', scenario: 'Valid Search', steps: 'Search existing name', expected: 'Table populates correctly' },
    { id: 'F-3.3', scenario: 'Cancel Pending Delivery', steps: 'Click Cancel and confirm', expected: 'Status changes to Cancelled instantly' }
  ]},
  { suite: 'Client - Status Tracking', tests: [
    { id: 'F-4.1', scenario: 'Visual Progress Bar', steps: 'Load Shipped delivery', expected: 'Visual steps sync with Shipped status' },
    { id: 'F-4.2', scenario: 'Cancel from Tracking', steps: 'Click Cancel on a Pending delivery', expected: 'Status updates, tracker turns red' }
  ]},
  { suite: 'Admin - Dashboard', tests: [
    { id: 'F-5.1', scenario: 'Stats aggregation', steps: 'View stats cards', expected: 'Numbers align with DB state' },
    { id: 'F-5.2', scenario: 'Stat click filtering', steps: 'Click Shipped stat card', expected: 'Redirects to All Deliveries filtered to Shipped' }
  ]},
  { suite: 'Admin - Delivery Management', tests: [
    { id: 'F-6.1', scenario: 'Enforced Status UI', steps: 'Open Pending delivery', expected: 'Dropdown offers Assigned or Cancelled only' },
    { id: 'F-6.2', scenario: 'Agent Assignment', steps: 'Type ID and Assign', expected: 'Agent assigns successfully' },
    { id: 'F-6.3', scenario: 'Row Deletion', steps: 'Delete a row and confirm', expected: 'Row is removed after confirmation' }
  ]}
];

const BACKEND_TESTS = [
  { suite: 'Delivery Creation', tests: [
    { id: 'B-1.1', scenario: 'Valid payload', expected: '201 Created - Status defaults to Pending' },
    { id: 'B-1.2', scenario: 'Missing fields', expected: '400 Bad Request - Validation error' }
  ]},
  { suite: 'Fetching Deliveries', tests: [
    { id: 'B-2.1', scenario: 'Get all deliveries', expected: '200 OK - Returns array sorted newest first' },
    { id: 'B-2.2', scenario: 'Filter by status', expected: '200 OK - Returns matching deliveries' },
    { id: 'B-2.3', scenario: 'Search keyword', expected: '200 OK - Matches name/address' },
    { id: 'B-2.4', scenario: 'Invalid ID', expected: '404 Not Found' }
  ]},
  { suite: 'Status Updates', tests: [
    { id: 'B-3.1', scenario: 'Valid transition', expected: '200 OK - Updates status' },
    { id: 'B-3.2', scenario: 'Invalid skipping transition', expected: '400 Bad Request - Error next allowed status' },
    { id: 'B-3.3', scenario: 'Update cancelled delivery', expected: '400 Bad Request - Blocked' }
  ]},
  { suite: 'Cancellation & Deletion', tests: [
    { id: 'B-4.1', scenario: 'Cancel Pending delivery', expected: '200 OK - Switched to Cancelled' },
    { id: 'B-4.2', scenario: 'Cancel Shipped delivery', expected: '400 Bad Request - Blocked' },
    { id: 'B-4.3', scenario: 'Delete delivery', expected: '200 OK - Permanently removed' }
  ]}
];

const TestCases = () => {
  const [tab, setTab] = useState('frontend');

  return (
    <div className="page-wrapper test-cases-page">
      <div className="section-header">
        <h1 className="page-title">QA Test Cases</h1>
        <div className="test-tabs">
          <button 
            className={`btn ${tab === 'frontend' ? 'btn-primary' : 'btn-secondary'}`} 
            onClick={() => setTab('frontend')}
          >
            Frontend Tests
          </button>
          <button 
            className={`btn ${tab === 'backend' ? 'btn-primary' : 'btn-secondary'}`} 
            onClick={() => setTab('backend')}
          >
            Backend Tests
          </button>
        </div>
      </div>

      <div className="test-content">
        {tab === 'frontend' && (
          <div className="test-list">
            <p className="test-description">
              These scenarios verify the User Interface components, checking for proper routing, client-side form validation, dynamic state rendering, restricted access controls, and overall user experience logic.
            </p>
            {FRONTEND_TESTS.map((suite, i) => (
              <div key={i} className="test-suite card">
                <h3>{suite.suite}</h3>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Scenario</th>
                        <th>Steps</th>
                        <th>Expected Outcome</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suite.tests.map(t => (
                        <tr key={t.id}>
                          <td><strong>{t.id}</strong></td>
                          <td>{t.scenario}</td>
                          <td>{t.steps}</td>
                          <td style={{ color: '#55efc4' }}>{t.expected}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'backend' && (
          <div className="test-list">
            <p className="test-description">
              These scenarios validate the core Node.js API endpoints, Mongoose database schema constraints, robust error handling, strict delivery status transitions, and secure data integrity operations.
            </p>
            {BACKEND_TESTS.map((suite, i) => (
              <div key={i} className="test-suite card">
                <h3>{suite.suite}</h3>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Scenario</th>
                        <th>Expected Outcome</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suite.tests.map(t => (
                        <tr key={t.id}>
                          <td><strong>{t.id}</strong></td>
                          <td>{t.scenario}</td>
                          <td style={{ color: '#55efc4' }}>{t.expected}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestCases;
