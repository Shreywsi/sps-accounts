import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Wallet,
} from "lucide-react";

import { getDashboardData } from "../api/fees";

import StatCard from "../components/dashboard/StatCard";
import RecentPayments from "../components/dashboard/RecentPayments";
import UnpaidStudents from "../features/dashboard/UnpaidStudents";

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardData()
      .then((res) => {
        console.log("Dashboard data:", res.data);
        setData(res.data);
      })
      .catch((err) => {
        console.error("Dashboard error:", err);
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
      onClick: () => navigate("/students"),
    },
    {
      title: "Financial",
      value: "View Dashboard",
      icon: Wallet,
      onClick: () => navigate("/financial-dashboard"),
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
          gap-5
        "
      >
        {cards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            onClick={card.onClick}
          />
        ))}
      </div>

      <UnpaidStudents />

      <RecentPayments
        payments={data?.recent_payments || []}
      />
    </div>
  );
}