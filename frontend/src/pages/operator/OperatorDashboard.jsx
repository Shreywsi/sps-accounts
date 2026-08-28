import { useEffect, useState } from "react";
import { Users, Wallet, AlertTriangle, Clock } from "lucide-react";

import { getDashboardData } from "../../api/fees";
import StatCard from "../../components/dashboard/StatCard";
import RecentPayments from "../../components/dashboard/RecentPayments";

export default function OperatorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardData()
      .then((res) => setData(res.data))
      .catch((err) => console.error("Operator dashboard error:", err))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      title: "Total Students",
      value: loading ? "…" : data?.total_students ?? 0,
      icon: Users,
    },
    {
      title: "Collected This Month",
      value: loading ? "…" : `₹${(data?.month_received ?? 0).toLocaleString()}`,
      icon: Wallet,
    },
    {
      title: "Students With Dues",
      value: loading ? "…" : data?.pending_students ?? 0,
      icon: AlertTriangle,
    },
    {
      title: "Late Payments Recorded",
      value: loading ? "…" : data?.late_payments_count ?? 0,
      icon: Clock,
    },
  ];

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
          />
        ))}
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

        <div className="md:col-span-2">
          <RecentPayments payments={data?.recent_payments || []} />
        </div>
      </div>
    </div>
  );
}
