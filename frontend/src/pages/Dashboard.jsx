import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  IndianRupee,
  Wallet,
  Clock,
  FileEdit,
  ArrowRight,
  Clock3,
} from "lucide-react";

import { getDashboardData } from "../api/fees";
import { getEventEditRequests } from "../api/events";

import StatCard from "../components/dashboard/StatCard";
import RecentPayments from "../components/dashboard/RecentPayments";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

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

  useEffect(() => {
    let ignore = false;
    getEventEditRequests({ status: "PENDING" })
      .then((res) => {
        if (ignore) return;
        setPendingRequests(res.data.results || res.data);
        setRequestsLoading(false);
      })
      .catch((err) => {
        if (!ignore) {
          console.error(err);
          setRequestsLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
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
    {
      title: "Received This Week",
      value: `₹ ${data?.week_received ?? 0}`,
      icon: Wallet,
    },
    {
      title: "Spent This Week",
      value: `₹ ${data?.week_spent ?? 0}`,
      icon: IndianRupee,
    },
    {
      title: "Received This Month",
      value: `₹ ${data?.month_received ?? 0}`,
      icon: Wallet,
    },
    {
      title: "Spent This Month",
      value: `₹ ${data?.month_spent ?? 0}`,
      icon: IndianRupee,
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

      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <FileEdit size={15} /> Operator requests
          </h2>
          <Link
            to="/admin/requests"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {requestsLoading ? (
          <p className="text-sm text-slate-400 py-4">Loading…</p>
        ) : pendingRequests.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">
            No pending requests from operators right now.
          </p>
        ) : (
          <div className="space-y-2">
            {pendingRequests.slice(0, 5).map((r) => (
              <Link
                key={r.id}
                to="/admin/requests"
                className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-md px-3 py-2 hover:bg-amber-100/60"
              >
                <Clock3 size={13} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-700">
                  <span className="font-medium">{r.requested_by_name}</span> wants to
                  edit <span className="font-medium">{r.event_name}</span>
                  <span className="text-slate-400"> — {r.reason}</span>
                </p>
              </Link>
            ))}
            {pendingRequests.length > 5 && (
              <p className="text-xs text-slate-400 pt-1">
                +{pendingRequests.length - 5} more pending
              </p>
            )}
          </div>
        )}
      </div>

      <RecentPayments
        payments={data?.recent_payments || []}
      />
    </div>
  );
}