import API from "./axios";


export const getDashboardData = () => {
  return API.get("/fees/dashboard/");
};

export const getDueFeesReport = () => {
  return API.get("/fees/reports/due-fees/");
};