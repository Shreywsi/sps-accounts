import { useState, useEffect } from "react";
import { Calendar, Clock, User, Trash2, Plus, Edit, CheckCircle, XCircle } from "lucide-react";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const ActivityDashboard = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("today");

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchActivities();
    }
  }, [timeFilter, user]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      let endpoint = "/activities/";

      switch (timeFilter) {
        case "today":
          endpoint = "/activities/today/";
          break;
        case "week":
          endpoint = "/activities/this_week/";
          break;
        case "month":
          endpoint = "/activities/last_month/";
          break;
        default:
          endpoint = "/activities/";
      }

      const response = await API.get(endpoint);
      // Filter to show only operator actions
      const operatorActivities = response.data.filter(
        (activity) => activity.actor_role === "OPERATOR"
      );
      setActivities(operatorActivities);
    } catch (error) {
      toast.error("Failed to fetch activities");
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case "CREATE_STUDENT":
        return <Plus className="w-5 h-5 text-green-600" />;
      case "UPDATE_STUDENT":
        return <Edit className="w-5 h-5 text-blue-600" />;
      case "DELETE_STUDENT":
        return <Trash2 className="w-5 h-5 text-red-600" />;
      case "VERIFY_STUDENT":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "REJECT_STUDENT":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Edit className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActionColor = (actionType) => {
    if (actionType.includes("CREATE") || actionType.includes("VERIFY")) {
      return "border-l-4 border-green-500 bg-green-50";
    } else if (actionType.includes("DELETE") || actionType.includes("REJECT")) {
      return "border-l-4 border-red-500 bg-red-50";
    } else if (actionType.includes("UPDATE")) {
      return "border-l-4 border-blue-500 bg-blue-50";
    }
    return "border-l-4 border-gray-500 bg-gray-50";
  };

  const getActionLabel = (actionType) => {
    return actionType.replace(/_/g, " ").replace("STUDENT", "Student");
  };

  if (user?.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Activity dashboard is only available for admins</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operator Activity</h1>
          <p className="text-gray-600 mt-1">
            Monitor all operator actions in real-time
          </p>
        </div>
        
        <div className="flex gap-2">
          {["today", "week", "month", "all"].map((filter) => (
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

      {/* Stats Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Operator Actions</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {activities.length}
            </p>
          </div>
          <User className="w-12 h-12 text-blue-600" />
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No operator activities found for this time period</p>
          </div>
        ) : (
          <div className="divide-y">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`p-4 ${getActionColor(activity.action_type)}`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getActionIcon(activity.action_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {activity.actor_username || "Unknown"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTimestamp(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded">
                        {getActionLabel(activity.action_type)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityDashboard;