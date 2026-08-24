export default function OperatorDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Operator Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Welcome to the Operator Panel. Manage students, payments, and activities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <a href="/operator/students" className="block text-blue-600 hover:text-blue-800">
              → View Students
            </a>
            <a href="/operator/events" className="block text-blue-600 hover:text-blue-800">
              → Manage Events
            </a>
            <a href="/operator/ledger" className="block text-blue-600 hover:text-blue-800">
              → View Expenses
            </a>
            <a href="/operator/financial-dashboard" className="block text-blue-600 hover:text-blue-800">
              → Financial Overview
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Activity</h3>
          <p className="text-gray-600">
            Track your recent actions and activities in the system.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Updates</h3>
          <p className="text-gray-600">
            Stay updated with the latest school announcements and system updates.
          </p>
        </div>
      </div>
    </div>
  );
}