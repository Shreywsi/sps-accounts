import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Check, X, Printer, ChevronDown, ChevronUp, Info } from "lucide-react";
import toast from "react-hot-toast";
import { getStudents, getStudentById } from "../api/students";
import {
  getClassMappingByClass,
  getGroupFeeHeads,
  getUniformItems,
  createFeeAssignmentFromTemplate,
  createStudentFeeAssignment,
  getActiveFeeSession,
} from "../api/feeStructure";
import { recordMonthlyPayment } from "../api/fees";

// Student.gender is stored as MALE / FEMALE / OTHER, but UniformFeeItem.gender
// is stored as boys / girls. This maps one to the other so the uniform list
// always matches the selected student instead of silently returning nothing
// (or, worse, the wrong gender's price list).
const mapStudentGenderToUniform = (gender) => {
  if (!gender) return null;
  const normalized = gender.toUpperCase();
  if (normalized === "MALE") return "boys";
  if (normalized === "FEMALE") return "girls";
  return null; // "OTHER" or unset - no automatic match, fall back to manual choice
};

export default function NewFeeCollection() {
  const [searchParams] = useSearchParams();
  const preloadedStudentId = searchParams.get("student");

  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fee data
  const [activeSession, setActiveSession] = useState(null);
  const [feeAssignment, setFeeAssignment] = useState(null);
  const [feeHeads, setFeeHeads] = useState([]);
  const [uniformItems, setUniformItems] = useState([]);
  const [uniformGender, setUniformGender] = useState("boys");
  const [selectedUniformItems, setSelectedUniformItems] = useState({});

  // Payment
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transactionRef, setTransactionRef] = useState("");
  const [installments, setInstallments] = useState(1);
  const [notes, setNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );

  // UI state
  const [showFeeDetails, setShowFeeDetails] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    (async () => {
      const session = await loadActiveSession();

      // Opened from a student's page (e.g. /fee-collection?student=<id>) -
      // load and select that student directly instead of making the user
      // search for them again.
      if (preloadedStudentId) {
        try {
          setLoading(true);
          const res = await getStudentById(preloadedStudentId);
          await handleSelectStudent(res.data, session);
        } catch (error) {
          toast.error("Failed to load student");
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preloadedStudentId]);

  const loadActiveSession = async () => {
    try {
      const res = await getActiveFeeSession();
      setActiveSession(res.data);
      return res.data;
    } catch (error) {
      console.error("Failed to load active session");
      return null;
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const res = await getStudents({ search: searchQuery });
      setStudents(res.data.results || res.data);
    } catch (error) {
      toast.error("Failed to search students");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = async (student, sessionOverride) => {
    setSelectedStudent(student);
    setStudents([]);

    const session = sessionOverride || activeSession;

    try {
      setLoading(true);

      // Uniform pricing is independent of the class fee structure, so it's
      // loaded up front (using the student's actual gender) and never
      // blocked by a missing class mapping / fee group below - a student
      // with no fee structure configured yet should still see their
      // uniform prices, and should see the correct gender's list from the
      // very first render instead of a stale "boys" default.
      const gender = mapStudentGenderToUniform(student.gender) || uniformGender;
      setUniformGender(gender);
      setSelectedUniformItems({});

      try {
        const uniformRes = await getUniformItems({
          session: session?.id,
          gender,
        });
        setUniformItems(uniformRes.data);
      } catch (error) {
        console.error("Failed to load uniform items", error);
      }

      // Get class mapping
      const className = student.school_class_name || student.school_class;
      const mappingRes = await getClassMappingByClass(className, session?.id);

      if (!mappingRes.data) {
        toast.error("No fee structure configured for this student's class");
        setLoading(false);
        return;
      }

      const mapping = mappingRes.data;

      // Determine boarding type (default to day scholar if not set)
      const boardingType = student.boarding_type || "day_scholar";
      const groupId = boardingType === "hostel" ? mapping.hostel_group : mapping.day_scholar_group;

      if (!groupId) {
        toast.error(`No ${boardingType} fee group configured for this class`);
        setLoading(false);
        return;
      }

      // Get fee heads for the group
      const headsRes = await getGroupFeeHeads(groupId);
      const heads = headsRes.data.map((head) => ({
        ...head,
        custom_amount: head.amount,
        is_active: true,
      }));
      setFeeHeads(heads);

      // Create or get fee assignment
      try {
        const assignmentRes = await createFeeAssignmentFromTemplate({
          student_id: student.id,
          session_id: session?.id,
          boarding_type: boardingType,
        });
        setFeeAssignment(assignmentRes.data);
      } catch (error) {
        // If template creation fails, use the heads directly
        setFeeAssignment({
          fee_heads: heads,
          boarding_type: boardingType,
        });
      }
    } catch (error) {
      toast.error("Failed to load fee structure");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUniformGenderChange = async (gender) => {
    setUniformGender(gender);
    try {
      const uniformRes = await getUniformItems({
        session: activeSession?.id,
        gender,
      });
      setUniformItems(uniformRes.data);
      setSelectedUniformItems({});
    } catch (error) {
      console.error("Failed to load uniform items", error);
    }
  };

  const calculateTotal = () => {
    let total = 0;

    // Fee heads
    feeHeads.forEach((head) => {
      if (head.is_active) {
        total += parseFloat(head.custom_amount || head.amount);
      }
    });

    // Uniform
    uniformItems.forEach((item) => {
      if (selectedUniformItems[item.id]) {
        total += parseFloat(item.price);
      }
    });

    return total;
  };

  const calculateOneTimeFees = () => {
    return feeHeads
      .filter((h) => h.is_active && h.frequency === "one_time")
      .reduce((sum, h) => sum + parseFloat(h.custom_amount || h.amount), 0);
  };

  const calculateAnnualFees = () => {
    return feeHeads
      .filter((h) => h.is_active && h.frequency === "yearly")
      .reduce((sum, h) => sum + parseFloat(h.custom_amount || h.amount), 0);
  };

  const calculateMonthlyFees = () => {
    return feeHeads
      .filter((h) => h.is_active && h.frequency === "monthly")
      .reduce((sum, h) => sum + parseFloat(h.custom_amount || h.amount), 0);
  };

  const calculateUniformTotal = () => {
    return uniformItems
      .filter((item) => selectedUniformItems[item.id])
      .reduce((sum, item) => sum + parseFloat(item.price), 0);
  };

  const handleFeeAmountChange = (headId, value) => {
    setFeeHeads(
      feeHeads.map((head) =>
        head.id === headId ? { ...head, custom_amount: value } : head
      )
    );
  };

  const handleToggleFeeHead = (headId) => {
    setFeeHeads(
      feeHeads.map((head) =>
        head.id === headId ? { ...head, is_active: !head.is_active } : head
      )
    );
  };

  const handleToggleUniformItem = (itemId) => {
    setSelectedUniformItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!selectedStudent) {
      toast.error("Please select a student");
      return;
    }

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    try {
      setLoading(true);

      // Create payment. payment_date is what the backend measures
      // lateness against (see SimplePayment.days_late) - it defaults to
      // today server-side if omitted, so always send it explicitly to
      // support backdated/late entries.
      await recordMonthlyPayment({
        student: selectedStudent.id,
        payment_type: "MONTHLY",
        amount: paymentAmount,
        payment_method: paymentMethod,
        transaction_reference: transactionRef,
        payment_date: paymentDate,
        notes: notes,
      });

      toast.success("Payment recorded successfully");
      setShowReceipt(true);
    } catch (error) {
      toast.error("Failed to record payment");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateInstallmentAmount = () => {
    const total = calculateTotal();
    const perInstallment = total / installments;
    return perInstallment.toFixed(2);
  };

  // Mirrors the backend fallback calculation in
  // SimplePayment._due_date_for_payment / days_late (see
  // backend/apps/fees/models/simple_payment.py) so what the operator sees
  // here matches what actually gets snapshotted onto the payment when it's
  // saved. Due day is taken from the student's fee settings (Fee Due Day),
  // clamped to the selected payment date's month/year.
  const getLateFeeInfo = () => {
    if (!selectedStudent || !paymentDate) {
      return { daysLate: 0, lateFee: 0, dueDay: null, rate: 0 };
    }

    const dueDay = parseInt(selectedStudent.fee_due_day, 10);
    const rate = parseFloat(selectedStudent.late_fee_per_day) || 0;

    if (!dueDay || !rate) {
      return { daysLate: 0, lateFee: 0, dueDay: dueDay || null, rate };
    }

    const paid = new Date(paymentDate + "T00:00:00");
    const lastDayOfMonth = new Date(
      paid.getFullYear(),
      paid.getMonth() + 1,
      0
    ).getDate();
    const clampedDueDay = Math.min(dueDay, lastDayOfMonth);
    const dueDate = new Date(paid.getFullYear(), paid.getMonth(), clampedDueDay);

    const msPerDay = 1000 * 60 * 60 * 24;
    const daysLate = Math.max(
      Math.round((paid - dueDate) / msPerDay),
      0
    );

    return {
      daysLate,
      lateFee: daysLate * rate,
      dueDay,
      rate,
    };
  };

  const lateFeeInfo = getLateFeeInfo();

  const handleAddLateFeeToAmount = () => {
    const current = parseFloat(paymentAmount) || 0;
    setPaymentAmount((current + lateFeeInfo.lateFee).toFixed(2));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Fee Collection</h1>
        <p className="text-sm text-gray-500">
          Collect fees with auto-populated fee structure
        </p>
      </div>

      {/* Student Search */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, admission no, or roll no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="w-full border rounded-md px-4 py-2"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2"
          >
            <Search size={18} />
            Search
          </button>
        </div>

        {/* Search Results */}
        {students.length > 0 && (
          <div className="mt-4 border rounded-md max-h-64 overflow-y-auto">
            {students.map((student) => (
              <div
                key={student.id}
                onClick={() => handleSelectStudent(student)}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
              >
                <div className="font-medium">
                  {student.first_name} {student.last_name}
                </div>
                <div className="text-sm text-gray-500">
                  {student.admission_no} · Class: {student.school_class_name || student.school_class}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Details and Fee Structure */}
      {selectedStudent && (
        <div className="space-y-6">
          {/* Student Info */}
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {selectedStudent.first_name} {selectedStudent.last_name}
                </h2>
                <p className="text-sm text-gray-500">
                  Admission No: {selectedStudent.admission_no} · Class:{" "}
                  {selectedStudent.school_class_name || selectedStudent.school_class} ·{" "}
                  {feeAssignment?.boarding_type === "hostel" ? "Hostel" : "Day Scholar"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Session</p>
                <p className="font-medium">{activeSession?.session_label}</p>
              </div>
            </div>
          </div>

          {/* Fee Heads */}
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Fee Structure</h3>
              <button
                onClick={() => setShowFeeDetails(!showFeeDetails)}
                className="text-sm text-blue-600 flex items-center gap-1"
              >
                {showFeeDetails ? "Hide" : "Show"} Details
                {showFeeDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {showFeeDetails && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 w-8"></th>
                    <th className="text-left py-2">Fee Head</th>
                    <th className="text-left py-2">Frequency</th>
                    <th className="text-right py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {feeHeads.map((head) => (
                    <tr key={head.id} className="border-b">
                      <td className="py-2">
                        <input
                          type="checkbox"
                          checked={head.is_active}
                          onChange={() => handleToggleFeeHead(head.id)}
                        />
                      </td>
                      <td className="py-2">{head.label}</td>
                      <td className="py-2 capitalize">{head.frequency}</td>
                      <td className="py-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={head.custom_amount}
                          onChange={(e) => handleFeeAmountChange(head.id, e.target.value)}
                          className="w-24 text-right border rounded px-2 py-1"
                          disabled={!head.is_active}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Fee Summary */}
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">One-time Fees:</span>
                <span>₹{calculateOneTimeFees().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Annual Fees:</span>
                <span>₹{calculateAnnualFees().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Fees:</span>
                <span>₹{calculateMonthlyFees().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Uniform Selection */}
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Uniform</h3>
              {mapStudentGenderToUniform(selectedStudent?.gender) ? (
                <span className="px-3 py-1 rounded text-sm bg-blue-600 text-white">
                  {uniformGender === "boys" ? "Boys" : "Girls"}
                  <span className="ml-1 text-blue-100 text-xs">(auto-detected)</span>
                </span>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUniformGenderChange("boys")}
                    className={`px-3 py-1 rounded text-sm ${
                      uniformGender === "boys"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    Boys
                  </button>
                  <button
                    onClick={() => handleUniformGenderChange("girls")}
                    className={`px-3 py-1 rounded text-sm ${
                      uniformGender === "girls"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    Girls
                  </button>
                </div>
              )}
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 w-8"></th>
                  <th className="text-left py-2">Item</th>
                  <th className="text-right py-2">Price</th>
                </tr>
              </thead>
              <tbody>
                {uniformItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">
                      <input
                        type="checkbox"
                        checked={selectedUniformItems[item.id] || false}
                        onChange={() => handleToggleUniformItem(item.id)}
                      />
                    </td>
                    <td className="py-2">{item.item_name}</td>
                    <td className="py-2 text-right">₹{item.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex justify-between font-medium">
              <span>Uniform Total:</span>
              <span>₹{calculateUniformTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Total Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="space-y-2">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Due:</span>
                <span>₹{calculateTotal().toFixed(2)}</span>
              </div>
              <div className="text-sm text-gray-600">
                <Info size={14} className="inline mr-1" />
                This includes one-time, annual, monthly fees, and uniform
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Payment</h3>

            <form onSubmit={handlePayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="Enter amount"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Fee due day for {selectedStudent.first_name}:{" "}
                  {selectedStudent.fee_due_day || "10"} of every month · Late
                  fee: ₹{selectedStudent.late_fee_per_day ?? "10"}/day
                </p>
              </div>

              {lateFeeInfo.daysLate > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-center justify-between">
                  <div className="text-sm">
                    <p className="font-medium text-amber-800">
                      Payment is {lateFeeInfo.daysLate} day
                      {lateFeeInfo.daysLate === 1 ? "" : "s"} late
                    </p>
                    <p className="text-amber-700">
                      Late fee: ₹{lateFeeInfo.rate}/day × {lateFeeInfo.daysLate}{" "}
                      day{lateFeeInfo.daysLate === 1 ? "" : "s"} = ₹
                      {lateFeeInfo.lateFee.toFixed(2)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddLateFeeToAmount}
                    className="px-3 py-1.5 bg-amber-600 text-white rounded-md text-sm whitespace-nowrap"
                  >
                    + Add to amount
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Transaction Reference (Optional)</label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="Enter reference number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Installments</label>
                <select
                  value={installments}
                  onChange={(e) => setInstallments(parseInt(e.target.value))}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value={1}>1 Payment (Full)</option>
                  <option value={2}>2 Installments</option>
                  <option value={3}>3 Installments</option>
                </select>
                {installments > 1 && (
                  <p className="text-sm text-gray-500 mt-1">
                    ₹{calculateInstallmentAmount()} per installment
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  rows={2}
                  placeholder="Add any notes..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-md font-medium disabled:opacity-50"
              >
                {loading ? "Processing..." : "Collect Payment"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && (
        <ReceiptModal
          student={selectedStudent}
          feeHeads={feeHeads}
          uniformItems={uniformItems}
          selectedUniformItems={selectedUniformItems}
          paymentAmount={paymentAmount}
          paymentMethod={paymentMethod}
          paymentDate={paymentDate}
          lateFeeInfo={lateFeeInfo}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}

function ReceiptModal({
  student,
  feeHeads,
  uniformItems,
  selectedUniformItems,
  paymentAmount,
  paymentMethod,
  paymentDate,
  lateFeeInfo,
  onClose,
}) {
  const totalFees = feeHeads
    .filter((h) => h.is_active)
    .reduce((sum, h) => sum + parseFloat(h.custom_amount || h.amount), 0);

  const uniformTotal = uniformItems
    .filter((item) => selectedUniformItems[item.id])
    .reduce((sum, item) => sum + parseFloat(item.price), 0);

  const total = totalFees + uniformTotal;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Payment Receipt</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="border rounded-lg p-6 space-y-4">
          {/* Header */}
          <div className="text-center border-b pb-4">
            <h3 className="text-lg font-bold">SPS Accounts</h3>
            <p className="text-sm text-gray-500">Fee Payment Receipt</p>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Student:</span>
              <span className="ml-2">
                {student?.first_name} {student?.last_name}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Admission No:</span>
              <span className="ml-2">{student?.admission_no}</span>
            </div>
            <div>
              <span className="text-gray-500">Class:</span>
              <span className="ml-2">
                {student?.school_class_name || student?.school_class}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Date:</span>
              <span className="ml-2">
                {paymentDate
                  ? new Date(paymentDate + "T00:00:00").toLocaleDateString()
                  : new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Fee Breakdown</h4>
            <table className="w-full text-sm">
              <tbody>
                {feeHeads
                  .filter((h) => h.is_active)
                  .map((head) => (
                    <tr key={head.id}>
                      <td className="py-1">{head.label}</td>
                      <td className="py-1 text-right">₹{head.custom_amount || head.amount}</td>
                    </tr>
                  ))}
                {uniformItems
                  .filter((item) => selectedUniformItems[item.id])
                  .map((item) => (
                    <tr key={item.id}>
                      <td className="py-1">Uniform - {item.item_name}</td>
                      <td className="py-1 text-right">₹{item.price}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Amount:</span>
              <span>₹{paymentAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Method:</span>
              <span className="capitalize">{paymentMethod}</span>
            </div>
            {lateFeeInfo?.daysLate > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>
                  Late Fee ({lateFeeInfo.daysLate} day
                  {lateFeeInfo.daysLate === 1 ? "" : "s"} @ ₹{lateFeeInfo.rate}/day):
                </span>
                <span>₹{lateFeeInfo.lateFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Balance Due:</span>
              <span>₹{(total - parseFloat(paymentAmount)).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md text-sm"
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm flex items-center gap-2"
          >
            <Printer size={16} />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}