import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Copy, Save, X, ChevronDown, ChevronUp, Info } from "lucide-react";
import toast from "react-hot-toast";
import {
  getFeeSessions,
  getActiveFeeSession,
  getFeeCategoryGroups,
  getFeeHeads,
  getUniformItems,
  getClassMappings,
  createFeeSession,
  createFeeCategoryGroup,
  createFeeHead,
  createUniformItem,
  createClassMapping,
  updateFeeHead,
  deleteFeeHead,
  updateFeeCategoryGroup,
  deleteFeeCategoryGroup,
  updateUniformItem,
  deleteUniformItem,
  updateClassMapping,
  deleteClassMapping,
} from "../api/feeStructure";
import { useAuth } from "../context/AuthContext";
import { getClasses } from "../api/academics";

const TABS = ["Day Scholar", "Hostel", "Uniform", "Class Mappings"];

export default function FeeStructureManagement() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const isOperator = user?.role === "OPERATOR";
  // Fee heads and fee groups can be created by admins and operators (backend:
  // IsAdminOrOperator); editing/deleting a group, uniform items, class
  // mappings, and fee-head deletion stay admin-only.
  const canManageHeads = isAdmin || isOperator;

  const [activeTab, setActiveTab] = useState("Day Scholar");
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fee Groups
  const [feeGroups, setFeeGroups] = useState([]);
  const [feeHeads, setFeeHeads] = useState([]);

  // Uniform Items
  const [uniformItems, setUniformItems] = useState([]);
  const [uniformGender, setUniformGender] = useState("boys");

  // Class Mappings
  const [classMappings, setClassMappings] = useState([]);
  const [mappingGroups, setMappingGroups] = useState([]); // all groups (both boarding types) for the mapping dropdowns
  const [schoolClasses, setSchoolClasses] = useState([]);

  // Modals
  const [showFeeHeadModal, setShowFeeHeadModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showUniformModal, setShowUniformModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);

  // Form data
  const [editingFeeHead, setEditingFeeHead] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingUniform, setEditingUniform] = useState(null);
  const [editingMapping, setEditingMapping] = useState(null);

  useEffect(() => {
    loadData();
    getClasses()
      .then((res) => setSchoolClasses(res.data.results || res.data))
      .catch((error) => console.error("Failed to load classes", error));
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadSessionData();
    }
    // uniformGender must be a dependency here - otherwise switching
    // Boys/Girls updates the button highlight but never re-fetches the
    // uniform items list, so the same (or no) items stay on screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSession, activeTab, uniformGender]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, activeRes] = await Promise.all([
        getFeeSessions(),
        getActiveFeeSession(),
      ]);
      setSessions(sessionsRes.data);
      setActiveSession(activeRes.data);
      setSelectedSession(activeRes.data?.id || sessionsRes.data[0]?.id);
    } catch (error) {
      toast.error("Failed to load fee structure data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionData = async () => {
    if (!selectedSession) return;

    try {
      if (activeTab === "Day Scholar" || activeTab === "Hostel") {
        const [groupsRes, headsRes] = await Promise.all([
          getFeeCategoryGroups({ session: selectedSession, boarding_type: activeTab === "Hostel" ? "hostel" : "day_scholar" }),
          getFeeHeads({ session: selectedSession }),
        ]);
        setFeeGroups(groupsRes.data);
        setFeeHeads(headsRes.data);
      } else if (activeTab === "Uniform") {
        const itemsRes = await getUniformItems({ session: selectedSession, gender: uniformGender });
        setUniformItems(itemsRes.data);
      } else if (activeTab === "Class Mappings") {
        const [mappingsRes, groupsRes] = await Promise.all([
          getClassMappings({ session: selectedSession }),
          getFeeCategoryGroups({ session: selectedSession }),
        ]);
        setClassMappings(mappingsRes.data);
        setMappingGroups(groupsRes.data);
      }
    } catch (error) {
      toast.error("Failed to load session data");
      console.error(error);
    }
  };

  const calculateTotal = (heads) => {
    return heads.reduce((sum, head) => sum + (parseFloat(head.amount) || 0), 0);
  };

  const calculateAnnualEquivalent = (heads) => {
    return heads.reduce((sum, head) => {
      if (head.frequency === "monthly") {
        return sum + (parseFloat(head.amount) || 0) * 12;
      } else if (head.frequency === "yearly" || head.frequency === "one_time") {
        return sum + (parseFloat(head.amount) || 0);
      }
      return sum;
    }, 0);
  };

  const calculateMonthlyTotal = (heads) => {
    return heads.reduce((sum, head) => {
      if (head.frequency === "monthly") {
        return sum + (parseFloat(head.amount) || 0);
      }
      return sum;
    }, 0);
  };

  const handleSaveFeeHead = async (formData) => {
    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      if (formData.id) {
        await updateFeeHead(formData.id, data);
        toast.success("Fee head updated successfully");
      } else {
        await createFeeHead(data);
        toast.success("Fee head created successfully");
      }

      setShowFeeHeadModal(false);
      setEditingFeeHead(null);
      loadSessionData();
    } catch (error) {
      toast.error("Failed to save fee head");
      console.error(error);
    }
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...editingGroup,
        session: selectedSession,
      };

      if (editingGroup.id) {
        await updateFeeCategoryGroup(editingGroup.id, data);
        toast.success("Fee group updated successfully");
      } else {
        await createFeeCategoryGroup(data);
        toast.success("Fee group created successfully");
      }

      setShowGroupModal(false);
      setEditingGroup(null);
      loadSessionData();
    } catch (error) {
      toast.error("Failed to save fee group");
      console.error(error);
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!confirm("Are you sure you want to delete this fee group? Its fee heads will be deleted too.")) return;

    try {
      await deleteFeeCategoryGroup(id);
      toast.success("Fee group deleted successfully");
      loadSessionData();
    } catch (error) {
      toast.error("Failed to delete fee group");
      console.error(error);
    }
  };

  const handleDeleteFeeHead = async (id) => {
    if (!confirm("Are you sure you want to delete this fee head?")) return;

    try {
      await deleteFeeHead(id);
      toast.success("Fee head deleted successfully");
      loadSessionData();
    } catch (error) {
      toast.error("Failed to delete fee head");
      console.error(error);
    }
  };

  const handleSaveUniformItem = async (formData) => {
    try {
      const data = {
        ...formData,
        session: selectedSession,
        gender: uniformGender,
        price: parseFloat(formData.price),
      };

      if (formData.id) {
        await updateUniformItem(formData.id, data);
        toast.success("Uniform item updated successfully");
      } else {
        await createUniformItem(data);
        toast.success("Uniform item created successfully");
      }

      setShowUniformModal(false);
      setEditingUniform(null);
      loadSessionData();
    } catch (error) {
      toast.error("Failed to save uniform item");
      console.error(error);
    }
  };

  const handleDeleteUniformItem = async (id) => {
    if (!confirm("Are you sure you want to delete this uniform item?")) return;

    try {
      await deleteUniformItem(id);
      toast.success("Uniform item deleted successfully");
      loadSessionData();
    } catch (error) {
      toast.error("Failed to delete uniform item");
      console.error(error);
    }
  };

  const handleSaveMapping = async (formData) => {
    try {
      const data = {
        ...formData,
        session: selectedSession,
      };

      if (formData.id) {
        await updateClassMapping(formData.id, data);
        toast.success("Class mapping updated successfully");
      } else {
        await createClassMapping(data);
        toast.success("Class mapping created successfully");
      }

      setShowMappingModal(false);
      setEditingMapping(null);
      loadSessionData();
    } catch (error) {
      toast.error("Failed to save class mapping");
      console.error(error);
    }
  };

  const handleDeleteMapping = async (id) => {
    if (!confirm("Are you sure you want to delete this class mapping?")) return;

    try {
      await deleteClassMapping(id);
      toast.success("Class mapping deleted successfully");
      loadSessionData();
    } catch (error) {
      toast.error("Failed to delete class mapping");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Fee Structure Management</h1>
          <p className="text-sm text-gray-500">
            Manage fee structures, uniform pricing, and class mappings
          </p>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={selectedSession || ""}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.session_label} {session.is_active && "(Active)"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "Day Scholar" && (
                <FeeStructureTab
          groups={feeGroups}
          heads={feeHeads}
          isAdmin={isAdmin}
          canManageHeads={canManageHeads}
          boardingType="day_scholar"
          onAddGroup={() => {
            setEditingGroup({
              name: "",
              boarding_type: "day_scholar",
              applicable_class_range: "",
              display_order: 0,
            });
            setShowGroupModal(true);
          }}
                    onEditGroup={(group) => {
            setEditingGroup(group);
            setShowGroupModal(true);
          }}
          onDeleteGroup={handleDeleteGroup}
          onAddHead={(groupId) => {
            setEditingFeeHead({
              group: groupId,
              label: "",
              frequency: "monthly",
              amount: "",
              is_mandatory: true,
              display_order: 0,
              notes: "",
            });
            setShowFeeHeadModal(true);
          }}
          onEditHead={(head) => {
            setEditingFeeHead(head);
            setShowFeeHeadModal(true);
          }}
          onDeleteHead={handleDeleteFeeHead}
          calculateTotal={calculateTotal}
          calculateAnnualEquivalent={calculateAnnualEquivalent}
          calculateMonthlyTotal={calculateMonthlyTotal}
        />
      )}

      {activeTab === "Hostel" && (
                <FeeStructureTab
          groups={feeGroups}
          heads={feeHeads}
          isAdmin={isAdmin}
          canManageHeads={canManageHeads}
          boardingType="hostel"
          onAddGroup={() => {
            setEditingGroup({
              name: "",
              boarding_type: "hostel",
              applicable_class_range: "",
              display_order: 0,
            });
            setShowGroupModal(true);
          }}
                    onEditGroup={(group) => {
            setEditingGroup(group);
            setShowGroupModal(true);
          }}
          onDeleteGroup={handleDeleteGroup}
          onAddHead={(groupId) => {
            setEditingFeeHead({
              group: groupId,
              label: "",
              frequency: "monthly",
              amount: "",
              is_mandatory: true,
              display_order: 0,
              notes: "",
            });
            setShowFeeHeadModal(true);
          }}
          onEditHead={(head) => {
            setEditingFeeHead(head);
            setShowFeeHeadModal(true);
          }}
          onDeleteHead={handleDeleteFeeHead}
          calculateTotal={calculateTotal}
          calculateAnnualEquivalent={calculateAnnualEquivalent}
          calculateMonthlyTotal={calculateMonthlyTotal}
          isHostel={true}
        />
      )}

      {activeTab === "Uniform" && (
        <UniformTab
          items={uniformItems}
          gender={uniformGender}
          onGenderChange={setUniformGender}
          isAdmin={isAdmin}
          onAddItem={() => {
            setEditingUniform({
              item_name: "",
              price: "",
              display_order: 0,
            });
            setShowUniformModal(true);
          }}
          onEditItem={(item) => {
            setEditingUniform(item);
            setShowUniformModal(true);
          }}
          onDeleteItem={handleDeleteUniformItem}
        />
      )}

      {activeTab === "Class Mappings" && (
        <ClassMappingsTab
          mappings={classMappings}
          feeGroups={mappingGroups}
          schoolClasses={schoolClasses}
          isAdmin={isAdmin}
          onAddMapping={() => {
            setEditingMapping({
              class_name: "",
              day_scholar_group: "",
              hostel_group: "",
              default_uniform_gender_required: true,
            });
            setShowMappingModal(true);
          }}
          onEditMapping={(mapping) => {
            setEditingMapping(mapping);
            setShowMappingModal(true);
          }}
          onDeleteMapping={handleDeleteMapping}
        />
      )}

      {/* Fee Group Modal */}
      {showGroupModal && (
        <GroupModal
          group={editingGroup}
          onClose={() => {
            setShowGroupModal(false);
            setEditingGroup(null);
          }}
          onChange={setEditingGroup}
          onSave={handleSaveGroup}
        />
      )}

      {/* Fee Head Modal */}
      {showFeeHeadModal && (
        <FeeHeadModal
          feeHead={editingFeeHead}
          groups={feeGroups}
          onClose={() => {
            setShowFeeHeadModal(false);
            setEditingFeeHead(null);
          }}
          onSave={handleSaveFeeHead}
        />
      )}

      {/* Uniform Item Modal */}
      {showUniformModal && (
        <UniformItemModal
          uniformItem={editingUniform}
          onClose={() => {
            setShowUniformModal(false);
            setEditingUniform(null);
          }}
          onSave={handleSaveUniformItem}
        />
      )}

      {/* Class Mapping Modal */}
      {showMappingModal && (
        <MappingModal
          mapping={editingMapping}
          feeGroups={mappingGroups}
          schoolClasses={schoolClasses}
          onClose={() => {
            setShowMappingModal(false);
            setEditingMapping(null);
          }}
          onSave={handleSaveMapping}
        />
      )}
    </div>
  );
}

// Sub-components
function FeeStructureTab({
  groups,
  heads,
  isAdmin,
  canManageHeads = isAdmin,
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
  onAddHead,
  onEditHead,
  onDeleteHead,
  calculateTotal,
  calculateAnnualEquivalent,
  calculateMonthlyTotal,
  isHostel = false,
}) {
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <div className="space-y-4">
      {canManageHeads && (
        <div className="flex justify-end">
          <button
            onClick={onAddGroup}
            className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
          >
            <Plus size={16} />
            Add Fee Group
          </button>
        </div>
      )}

      {groups.map((group) => {
        const groupHeads = heads.filter((h) => h.group === group.id);
        const isExpanded = expandedGroups[group.id];

        return (
          <div key={group.id} className="bg-white border rounded-lg">
            <div className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={() => toggleGroup(group.id)}
              >
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                              <div>
                  <h3 className="font-semibold">{group.name}</h3>
                  <p className="text-sm text-gray-500">{group.applicable_class_range}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium">
                  {groupHeads.length} fee heads
                </p>
                {canManageHeads && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditGroup(group);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                    title="Edit group name / class range"
                  >
                    <Edit size={16} />
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteGroup(group.id);
                    }}
                    className="text-red-600 hover:text-red-800"
                    title="Delete group"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="border-t p-4 space-y-4">
                                {canManageHeads && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => onAddHead(group.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm"
                    >
                      <Plus size={14} />
                      Add Fee Head
                    </button>
                  </div>
                )}
                <FeeHeadsTable
                  heads={groupHeads}
                  isAdmin={isAdmin}
                  canManageHeads={canManageHeads}
                  onEdit={onEditHead}
                  onDelete={onDeleteHead}
                  calculateTotal={calculateTotal}
                  calculateAnnualEquivalent={calculateAnnualEquivalent}
                  calculateMonthlyTotal={calculateMonthlyTotal}
                  isHostel={isHostel}
                />
              </div>
            )}
          </div>
        );
      })}

      {groups.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No fee groups found for this session
        </div>
      )}
    </div>
  );
}

function FeeHeadsTable({
  heads,
  isAdmin,
  canManageHeads = isAdmin,
  onEdit,
  onDelete,
  calculateTotal,
  calculateAnnualEquivalent,
  calculateMonthlyTotal,
  isHostel,
}) {
  return (
    <div className="space-y-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Fee Head</th>
            <th className="text-left py-2">Frequency</th>
            <th className="text-right py-2">Amount</th>
            <th className="text-right py-2">Annual</th>
            <th className="text-center py-2">Mandatory</th>
            {canManageHeads && <th className="text-right py-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {heads.map((head) => {
            // Operators can only edit heads explicitly marked editable by
            // admin_operator (mirrors the backend's editable_by check);
            // delete stays admin-only regardless.
            const canEditThisHead =
              isAdmin || (canManageHeads && head.editable_by === "admin_operator");
            return (
              <tr key={head.id} className="border-b">
                <td className="py-2">{head.label}</td>
                <td className="py-2 capitalize">{head.frequency}</td>
                <td className="py-2 text-right">₹{head.amount}</td>
                <td className="py-2 text-right">₹{head.annual_equivalent}</td>
                <td className="py-2 text-center">
                  {head.is_mandatory ? "Yes" : "No"}
                </td>
                {canManageHeads && (
                  <td className="py-2 text-right">
                    {canEditThisHead && (
                      <button
                        onClick={() => onEdit(head)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => onDelete(head.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total One-time + Annual:</span>
          <span className="font-medium">₹{calculateAnnualEquivalent(heads).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Monthly Tuition:</span>
          <span className="font-medium">₹{calculateMonthlyTotal(heads).toFixed(2)}</span>
        </div>
        {isHostel && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Monthly Hostel Fee:</span>
              <span className="font-medium">₹{calculateMonthlyTotal(heads).toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-medium">
              <span>Total Annual Package:</span>
              <span>₹{calculateAnnualEquivalent(heads).toFixed(2)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function UniformTab({
  items,
  gender,
  onGenderChange,
  isAdmin,
  onAddItem,
  onEditItem,
  onDeleteItem,
}) {
  const total = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onGenderChange("boys")}
            className={`px-4 py-2 rounded-md text-sm ${
              gender === "boys"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Boys
          </button>
          <button
            onClick={() => onGenderChange("girls")}
            className={`px-4 py-2 rounded-md text-sm ${
              gender === "girls"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Girls
          </button>
        </div>
        {isAdmin && (
          <button
            onClick={onAddItem}
            className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
          >
            <Plus size={16} />
            Add Uniform Item
          </button>
        )}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Item</th>
            <th className="text-right py-2">Price</th>
            {isAdmin && <th className="text-right py-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="py-2">{item.item_name}</td>
              <td className="py-2 text-right">₹{item.price}</td>
              {isAdmin && (
                <td className="py-2 text-right">
                  <button
                    onClick={() => onEditItem(item)}
                    className="text-blue-600 hover:text-blue-800 mr-2"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between font-medium">
          <span>Total:</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function ClassMappingsTab({ mappings, feeGroups, schoolClasses, isAdmin, onAddMapping, onEditMapping, onDeleteMapping }) {
  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={onAddMapping}
            className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
          >
            <Plus size={16} />
            Add Class Mapping
          </button>
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Class</th>
            <th className="text-left py-2">Day Scholar Group</th>
            <th className="text-left py-2">Hostel Group</th>
            {isAdmin && <th className="text-right py-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {mappings.map((mapping) => (
            <tr key={mapping.id} className="border-b">
              <td className="py-2 font-medium">{mapping.class_name}</td>
              <td className="py-2">
                {mapping.day_scholar_group_details?.name || "-"}
              </td>
              <td className="py-2">
                {mapping.hostel_group_details?.name || "-"}
              </td>
              {isAdmin && (
                <td className="py-2 text-right">
                  <button
                    onClick={() => onEditMapping(mapping)}
                    className="text-blue-600 hover:text-blue-800 mr-2"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDeleteMapping(mapping.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {mappings.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No class mappings found for this session. Add one to link a class
          to its fee group so students in that class show the right fees.
        </div>
      )}
    </div>
  );
}

function MappingModal({ mapping, feeGroups, schoolClasses, onClose, onSave }) {
  const [formData, setFormData] = useState(
    mapping || {
      class_name: "",
      day_scholar_group: "",
      hostel_group: "",
      default_uniform_gender_required: true,
    }
  );

  const dayScholarGroups = feeGroups.filter((g) => g.boarding_type === "day_scholar");
  const hostelGroups = feeGroups.filter((g) => g.boarding_type === "hostel");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      day_scholar_group: formData.day_scholar_group || null,
      hostel_group: formData.hostel_group || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {mapping?.id ? "Edit Class Mapping" : "Add Class Mapping"}
          </h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Class</label>
            <select
              value={formData.class_name}
              onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
              required
            >
              <option value="" disabled>
                Select a class
              </option>
              {schoolClasses.map((cls) => (
                <option key={cls.id} value={cls.name}>
                  {cls.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Must match the class exactly as set on the student's profile.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Day Scholar Fee Group</label>
            <select
              value={formData.day_scholar_group || ""}
              onChange={(e) => setFormData({ ...formData, day_scholar_group: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="">None</option>
              {dayScholarGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Hostel Fee Group</label>
            <select
              value={formData.hostel_group || ""}
              onChange={(e) => setFormData({ ...formData, hostel_group: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="">None</option>
              {hostelGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="uniform_required"
              checked={formData.default_uniform_gender_required}
              onChange={(e) =>
                setFormData({ ...formData, default_uniform_gender_required: e.target.checked })
              }
            />
            <label htmlFor="uniform_required" className="text-sm">
              Uniform selection applies to this class
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GroupModal({ group, onClose, onChange, onSave }) {
  const formData = group || {
    name: "",
    boarding_type: "day_scholar",
    applicable_class_range: "",
    display_order: 0,
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {group?.id ? "Edit Fee Group" : "Add Fee Group"}
          </h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Group Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
              placeholder="e.g. Day Scholar - Primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Applicable Class Range</label>
            <input
              type="text"
              value={formData.applicable_class_range}
              onChange={(e) => onChange({ ...formData, applicable_class_range: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
              placeholder="e.g. I-V"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FeeHeadModal({ feeHead, groups, onClose, onSave }) {
  const [formData, setFormData] = useState(
    feeHead || {
      group: groups[0]?.id,
      label: "",
      frequency: "monthly",
      amount: "",
      is_mandatory: true,
      display_order: 0,
      notes: "",
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, group: formData.group || groups[0]?.id });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {feeHead?.id ? "Edit Fee Head" : "Add Fee Head"}
          </h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Label</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Frequency</label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="one_time">One-time</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="mandatory"
              checked={formData.is_mandatory}
              onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
            />
            <label htmlFor="mandatory" className="text-sm">Mandatory</label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UniformItemModal({ uniformItem, onClose, onSave }) {
  const [formData, setFormData] = useState(
    uniformItem || {
      item_name: "",
      price: "",
      display_order: 0,
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {uniformItem?.id ? "Edit Uniform Item" : "Add Uniform Item"}
          </h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Item Name</label>
            <input
              type="text"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}