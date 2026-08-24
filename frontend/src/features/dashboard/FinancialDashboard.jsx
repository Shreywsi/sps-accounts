import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, TrendingDown, Clock, AlertCircle, Calendar } from "lucide-react";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const FinancialDashboard = () => {
  const { user } = useAuth();
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("month");
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: "",
  });

  useEffect(() => {
    if (user?.role === "ADMIN" || user?.role === "OPERATOR") {
      fetchFinancialData();
    }
  }, [timeFilter, user, customDateRange]);

  const fetchFinancialData = async () => {
    try {
      let endpoint = "/fees/dashboard/";
      const params = new URLSearchParams();
      
      if (timeFilter === "custom" && customDateRange.start && customDateRange.end) {
        params.append("start_date", customDateRange.start);
        params.append("end_date", customDateRange.end);
      } else {
        params.append("time_filter", timeFilter);
      }
      
      const response = await API.get(`${endpoint}?${params.toString()}`);
      setFinancialData(response.data);
    } catch (error) {
      toast.error("Failed to fetch financial data");
      console.error("Error fetching financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = () => {
    if (customDateRange.start && customDateRange.end) {
      setTimeFilter("custom");
      fetchFinancialData();
    } else {
      toast.error("Please select both start and end dates");
    }
  };

  if (user?.role !== "ADMIN" && user?.role !== "OPERATOR") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Financial dashboard is only available for admins and operators</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Track income, expenses, and payment status
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {["today", "week", "month", "year", "custom"].map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                timeFilter === filter
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range */}
      {timeFilter === "custom" && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) =>
                  setCustomDateRange({ ...customDateRange, start: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) =>
                  setCustomDateRange({ ...customDateRange, end: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleDateRangeChange}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Apply Range
            </button>
          </div>
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                ₹{financialData?.monthly_income?.toFixed(2) || 0}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                ₹{financialData?.monthly_expenses?.toFixed(2) || 0}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Income</p>
              <p className={`text-2xl font-bold mt-1 ${
                (financialData?.net_income || 0) >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                ₹{financialData?.net_income?.toFixed(2) || 0}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Period</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {financialData?.time_filter || "month"}
              </p>
              <p className="text-xs text-gray-500">
                {financialData?.start_date} to {financialData?.end_date}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Payment Breakdown */}
      {financialData?.payment_breakdown && financialData.payment_breakdown.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Payment Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {financialData.payment_breakdown.map((item) => (
              <div key={item.payment_type} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{item.payment_type.replace(/_/g, ' ')}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">₹{item.total.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Status - Admin Only */}
      {user?.role === "ADMIN" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {financialData?.pending_payments || 0}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected Payments</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {financialData?.rejected_payments || 0}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      )}

      {/* Alert Banner */}
      {user?.role === "ADMIN" && (financialData?.pending_payments || 0) > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Action Required</span>
          </div>
          <p className="text-yellow-700 mt-1">
            {financialData.pending_payments} payment(s) pending admin review
          </p>
        </div>
      )}
    </div>
  );
};

export default FinancialDashboard;