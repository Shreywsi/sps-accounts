import API from "./axios";


export const getDashboardData = () => {
  return API.get("/fees/dashboard/");
};