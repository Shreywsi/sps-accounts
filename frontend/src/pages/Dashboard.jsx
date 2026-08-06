import { useEffect, useState } from "react";
import {
  Users,
  IndianRupee,
  Wallet,
  Clock,
} from "lucide-react";

import { getDashboardData } from "../api/fees";

import StatCard from "../components/dashboard/StatCard";
import RecentPayments from "../components/dashboard/RecentPayments";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardData()
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  const cards = [
    {
      title: "Total Students",
      value: data?.total_students ?? 0,
      icon: Users,
    },
    {
      title: "Assigned Fees",
      value: `₹ ${data?.total_assigned ?? 0}`,
      icon: IndianRupee,
    },
    {
      title: "Collected",
      value: `₹ ${data?.total_collected ?? 0}`,
      icon: Wallet,
    },
    {
      title: "Pending",
      value: `₹ ${data?.total_due ?? 0}`,
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">
          Dashboard
        </h1>

        <p className="text-sm text-gray-500">
          School financial overview
        </p>
      </div>

      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          xl:grid-cols-4
          gap-5
        "
      >
        {cards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
          />
        ))}
      </div>

      <RecentPayments
        payments={data?.recent_payments || []}
      />
    </div>
  );
}