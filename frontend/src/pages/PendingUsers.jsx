import { useEffect, useState } from "react";
import API from "../api/axios";

export default function PendingUsers() {

  const [users, setUsers] = useState([]);

  const fetchPendingUsers = async () => {
    try {
      const res = await API.get("/auth/users/pending/");
      console.log(res.data);
      setUsers(res.data);
    } catch (error) {
      console.log("Pending users error:", error.response);
    }
  };


  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await API.get("/auth/users/pending/");
        if (mounted) setUsers(res.data);
      } catch (error) {
        console.log("Pending users error:", error.response);
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
      fetchPendingUsers();

    } catch(error) {
      console.log(
        "Approve error:",
        error.response
      );
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

    </div>
  );
}