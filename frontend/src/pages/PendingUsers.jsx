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
    fetchPendingUsers();
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


      <table className="w-full border">

        <thead>
          <tr>
            <th className="border p-2">
              Username
            </th>

            <th className="border p-2">
              Name
            </th>

            <th className="border p-2">
              Email
            </th>

            <th className="border p-2">
              Role
            </th>

            <th className="border p-2">
              Status
            </th>

            <th className="border p-2">
              Action
            </th>
          </tr>
        </thead>


        <tbody>

        {
          users.map((user)=>(
            <tr key={user.id}>

              <td className="border p-2">
                {user.username}
              </td>


              <td className="border p-2">
                {user.first_name} {user.last_name}
              </td>


              <td className="border p-2">
                {user.email}
              </td>


              <td className="border p-2">
                {user.role}
              </td>


              <td className="border p-2">
                {user.account_status}
              </td>


              <td className="border p-2">

                <button
                  onClick={() => approveUser(user.id)}
                  className="px-3 py-1 bg-green-600 text-white"
                >
                  Approve
                </button>

              </td>


            </tr>
          ))
        }

        </tbody>

      </table>

    </div>
  );
}