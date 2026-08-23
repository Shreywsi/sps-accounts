import { useEffect, useState } from "react";
import API from "../api/axios";

export default function PendingUsers() {

  const [users, setUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [rejectedUsers, setRejectedUsers] = useState([]);
  const [showAllUsers, setShowAllUsers] = useState(false);

  const fetchUsers = async () => {
    try {
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        API.get("/auth/users/pending/"),
        API.get("/auth/users/approved/"),
        API.get("/auth/users/rejected/"),
      ]);
      setUsers(pendingRes.data);
      setApprovedUsers(approvedRes.data);
      setRejectedUsers(rejectedRes.data);
    } catch (error) {
      console.log("User management error:", error.response);
    }
  };


  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
          API.get("/auth/users/pending/"),
          API.get("/auth/users/approved/"),
          API.get("/auth/users/rejected/"),
        ]);
        if (mounted) {
          setUsers(pendingRes.data);
          setApprovedUsers(approvedRes.data);
          setRejectedUsers(rejectedRes.data);
        }
      } catch (error) {
        console.log("User management error:", error.response);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);


  const approveUser = async (id) => {

    try {

      const res = await API.post(
        `/auth/users/${id}/approve/`
        );

      console.log(res.data);

      // refresh list
      fetchUsers();

    } catch(error) {
      console.log(
        "Approve error:",
        error.response
      );
    }

  };

  const revokeUser = async (user) => {
    if (!window.confirm(`Revoke access for ${user.username}?`)) return;

    try {
      await API.post(`/auth/users/${user.id}/revoke/`);
      fetchUsers();
    } catch (error) {
      console.log("Revoke error:", error.response);
    }
  };

  const reapproveUser = async (id) => {
    if (!window.confirm("Re-approve this user? They will be able to login again.")) return;

    try {
      await API.post(`/auth/users/${id}/approve/`);
      fetchUsers();
    } catch (error) {
      console.log("Re-approve error:", error.response);
    }
  };


  return (
    <div>

      <h1 className="text-2xl font-semibold mb-6">
        Pending Operators
      </h1>


      <div className="overflow-x-auto bg-white border rounded-md">
        <table className="min-w-[720px] w-full divide-y">
          <thead className="bg-gray-50">
            <tr className="text-left text-sm text-gray-600">
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">{user.username}</td>

                <td className="px-4 py-3">{user.first_name} {user.last_name}</td>

                <td className="px-4 py-3">{user.email}</td>

                <td className="px-4 py-3">{user.role}</td>

                <td className="px-4 py-3">{user.account_status}</td>

                <td className="px-4 py-3">
                  <button
                    onClick={() => approveUser(user.id)}
                    className="px-3 py-1 bg-green-600 text-white rounded-md text-sm"
                  >
                    Approve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-semibold mt-10 mb-4">
        Approved Operators
      </h2>

      <div className="overflow-x-auto bg-white border rounded-md">
        <table className="min-w-[720px] w-full divide-y">
          <thead className="bg-gray-50">
            <tr className="text-left text-sm text-gray-600">
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {approvedUsers.map((user) => (
              <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">{user.username}</td>
                <td className="px-4 py-3">{user.first_name} {user.last_name}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3 text-green-700">Approved</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => revokeUser(user)}
                    className="px-3 py-1 bg-red-600 text-white rounded-md text-sm"
                  >
                    Revoke Access
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {approvedUsers.length === 0 && (
          <p className="px-4 py-4 text-sm text-gray-500">
            No approved operators.
          </p>
        )}
      </div>

      <h2 className="text-xl font-semibold mt-10 mb-4">
        Rejected Operators
      </h2>

      <div className="overflow-x-auto bg-white border rounded-md">
        <table className="min-w-[720px] w-full divide-y">
          <thead className="bg-gray-50">
            <tr className="text-left text-sm text-gray-600">
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rejectedUsers.map((user) => (
              <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">{user.username}</td>
                <td className="px-4 py-3">{user.first_name} {user.last_name}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3 text-red-700">Rejected</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => reapproveUser(user.id)}
                    className="px-3 py-1 bg-green-600 text-white rounded-md text-sm"
                  >
                    Re-approve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rejectedUsers.length === 0 && (
          <p className="px-4 py-4 text-sm text-gray-500">
            No rejected operators.
          </p>
        )}
      </div>

    </div>
  );
}