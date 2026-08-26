import API from "./axios";

// Fee Sessions
export const getFeeSessions = (params = {}) =>
  API.get("/fees/fee-sessions/", { params });

export const getActiveFeeSession = () =>
  API.get("/fees/fee-sessions/active/");

export const createFeeSession = (data) =>
  API.post("/fees/fee-sessions/", data);

export const updateFeeSession = (id, data) =>
  API.patch(`/fees/fee-sessions/${id}/`, data);

export const deleteFeeSession = (id) =>
  API.delete(`/fees/fee-sessions/${id}/`);

// Fee Category Groups
export const getFeeCategoryGroups = (params = {}) =>
  API.get("/fees/fee-category-groups/", { params });

export const createFeeCategoryGroup = (data) =>
  API.post("/fees/fee-category-groups/", data);

export const updateFeeCategoryGroup = (id, data) =>
  API.patch(`/fees/fee-category-groups/${id}/`, data);

export const deleteFeeCategoryGroup = (id) =>
  API.delete(`/fees/fee-category-groups/${id}/`);

export const getGroupFeeHeads = (groupId) =>
  API.get(`/fees/fee-category-groups/${groupId}/fee_heads/`);

// Fee Heads
export const getFeeHeads = (params = {}) =>
  API.get("/fees/fee-heads/", { params });

export const createFeeHead = (data) =>
  API.post("/fees/fee-heads/", data);

export const updateFeeHead = (id, data) =>
  API.patch(`/fees/fee-heads/${id}/`, data);

export const deleteFeeHead = (id) =>
  API.delete(`/fees/fee-heads/${id}/`);

// Uniform Items
export const getUniformItems = (params = {}) =>
  API.get("/fees/uniform-items/", { params });

export const createUniformItem = (data) =>
  API.post("/fees/uniform-items/", data);

export const updateUniformItem = (id, data) =>
  API.patch(`/fees/uniform-items/${id}/`, data);

export const deleteUniformItem = (id) =>
  API.delete(`/fees/uniform-items/${id}/`);

// Class Mappings
export const getClassMappings = (params = {}) =>
  API.get("/fees/class-mappings/", { params });

export const getClassMappingByClass = (className, sessionId) =>
  API.get("/fees/class-mappings/by_class/", {
    params: { class_name: className, session: sessionId }
  });

export const createClassMapping = (data) =>
  API.post("/fees/class-mappings/", data);

export const updateClassMapping = (id, data) =>
  API.patch(`/fees/class-mappings/${id}/`, data);

export const deleteClassMapping = (id) =>
  API.delete(`/fees/class-mappings/${id}/`);

// Student Fee Assignments
export const getStudentFeeAssignments = (params = {}) =>
  API.get("/fees/student-fee-assignments/", { params });

export const createStudentFeeAssignment = (data) =>
  API.post("/fees/student-fee-assignments/", data);

export const createFeeAssignmentFromTemplate = (data) =>
  API.post("/fees/student-fee-assignments/create_from_template/", data);

export const updateStudentFeeAssignment = (id, data) =>
  API.patch(`/fees/student-fee-assignments/${id}/`, data);

export const deleteStudentFeeAssignment = (id) =>
  API.delete(`/fees/student-fee-assignments/${id}/`);
