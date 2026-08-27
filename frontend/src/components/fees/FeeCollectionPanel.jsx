import { useState, useEffect } from "react";
import { Check, X, Printer, ChevronDown, ChevronUp, Info } from "lucide-react";
import toast from "react-hot-toast";
import {
  getClassMappingByClass,
  getGroupFeeHeads,
  getUniformItems,
  createFeeAssignmentFromTemplate,
  getActiveFeeSession,
} from "../../api/feeStructure";
import { recordMonthlyPayment } from "../../api/fees";

// Student.gender is stored as MALE / FEMALE / OTHER, but UniformFeeItem.gender
// is stored as boys / girls. This maps one to the other so the uniform list
// always matches the selected student instead of silently returning nothing.
const mapStudentGenderToUniform = (gender) => {
  if (!gender) return null;
  const normalized = gender.toUpperCase();
  if (normalized === "MALE") return "boys";
  if (normalized === "FEMALE") return "girls";
  return null; // "OTHER" or unset - no automatic match, fall back to manual choice
};

/**
 * The single, reusable "collect fees for this student" UI.
 *
 * Used two places:
 *  - embedded directly on the student detail page (StudentDetailWithFees)
 *  - the standalone /fee-collection page (NewFeeCollection), after a
 *    student is picked from search
 *
 * There is intentionally only one copy of this logic - it always reads
 * whatever fee structure is currently defined for the student's class
 * (session -> class mapping -> fee group -> fee heads), so editing the
 * fee structure anywhere shows up here automatically.
 */
export default function FeeCollectionPanel({ student }) {
  const [loading, setLoading] = useState(false);

  // Fee data
  const [activeSession, setActiveSession] = useState(null);
  const [feeAssignment, setFeeAssignment] = useState(null);
  const [feeHeads, setFeeHeads] = useState([]);
  const [uniformItems, setUniformItems] = useState([]);
  const [uniformGender, setUniformGender] = useState("boys");
  const [selectedUniformItems, setSelectedUniformItems] = useState({});

  // When the student's gender is known (MALE/FEMALE), the uniform list is
  // locked to that gender - the operator shouldn't be able to accidentally
  // pull up the other gender's price list. The toggle only stays editable
  // when gender is unset/"OTHER", so someone can still pick manually.
  const detectedUniformGender = mapStudentGenderToUniform(student?.gender);

  // Payment
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transactionRef, setTransactionRef] = useState("");
  const [installments, setInstallments] = useState(1);
  const [notes, setNotes] = useState("");

  // UI state
  const [showFeeDetails, setShowFeeDetails] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    if (student?.id) {
      loadFeeStructure(student);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id]);

  const loadFeeStructure = async (targetStudent) => {
    setFeeHeads([]);
    setUniformItems([]);
    setFeeAssignment(null);
    setSelectedUniformItems({});

    try {
      setLoading(true);

      const sessionRes = await getActiveFeeSession();
      const session = sessionRes.data;
      setActiveSession(session);

      // Uniform pricing is independent of the class fee structure, so it's
      // loaded up front and never blocked by a missing class mapping / fee
      // group below - a student with no fee structure configured yet should
      // still see their uniform prices.
      const gender = mapStudentGenderToUniform(targetStudent.gender) || uniformGender;
      setUniformGender(gender);

      try {
        const uniformRes = await getUniformItems({
          session: session?.id,
          gender,
        });
        setUniformItems(uniformRes.data);
      } catch (error) {
        console.error("Failed to load uniform items", error);
      }

      const boardingType = targetStudent.boarding_type || "day_scholar";
      const className = targetStudent.school_class_name || targetStudent.school_class;
      const mappingRes = await getClassMappingByClass(className, session?.id);

      if (!mappingRes.data) {
        toast.error("No fee structure configured for this student's class");
        return;
      }

      const mapping = mappingRes.data;
      const groupId = boardingType === "hostel" ? mapping.hostel_group : mapping.day_scholar_group;

      if (!groupId) {
        toast.error(`No ${boardingType} fee group configured for this class`);
        return;
      }

      const headsRes = await getGroupFeeHeads(groupId);
      const heads = headsRes.data.map((head) => ({
        ...head,
        custom_amount: head.amount,
        is_active: true,
      }));
      setFeeHeads(heads);

      try {
        const assignmentRes = await createFeeAssignmentFromTemplate({
          student_id: targetStudent.id,
          session_id: session?.id,
          boarding_type: boardingType,
        });
        setFeeAssignment(assignmentRes.data);
      } catch (error) {
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

  const calculateTotal = () => {
    let total = 0;

    feeHeads.forEach((head) => {
      if (head.is_active) {
        total += parseFloat(head.custom_amount || head.amount);
      }
    });

    uniformItems.forEach((item) => {
      if (selectedUniformItems[item.id]) {
        total += parseFloat(item.price);
      }
    });

    return total;
  };

  const calculateOneTimeFees = () =>
    feeHeads
      .filter((h) => h.is_active && h.frequency === "one_time")
      .reduce((sum, h) => sum + parseFloat(h.custom_amount || h.amount), 0);

  const calculateAnnualFees = () =>
    feeHeads
      .filter((h) => h.is_active && h.frequency === "yearly")
      .reduce((sum, h) => sum + parseFloat(h.custom_amount || h.amount), 0);

  const calculateMonthlyFees = () =>
    feeHeads
      .filter((h) => h.is_active && h.frequency === "monthly")
      .reduce((sum, h) => sum + parseFloat(h.custom_amount || h.amount), 0);

  const calculateUniformTotal = () =>
    uniformItems
      .filter((item) => selectedUniformItems[item.id])
      .reduce((sum, item) => sum + parseFloat(item.price), 0);

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

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    try {
      setLoading(true);

      await recordMonthlyPayment({
        student: student.id,
        payment_type: "MONTHLY",
        amount: paymentAmount,
        payment_method: paymentMethod,
        transaction_reference: transactionRef,
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

  if (!student) return null;

  return (
    <div className="space-y-6">
      {/* Session banner */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {feeAssignment?.boarding_type === "hostel" ? "Hostel" : "Day Scholar"} fee structure for{" "}
          {student.school_class_name || student.school_class}
        </p>
        <div className="text-right">
          <p className="text-sm text-gray-500">Session</p>
          <p className="font-medium">{activeSession?.session_label || "—"}</p>
        </div>
      </div>

      {loading && feeHeads.length === 0 ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
                <>
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
                {detectedUniformGender ? (
                  <span className="px-3 py-1 rounded text-sm bg-blue-600 text-white">
                    {detectedUniformGender === "boys" ? "Boys" : "Girls"}
                    <span className="ml-1 text-blue-100 text-xs">(auto-detected)</span>
                  </span>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUniformGenderChange("boys")}
                      className={`px-3 py-1 rounded text-sm ${
                        uniformGender === "boys" ? "bg-blue-600 text-white" : "bg-gray-100"
                      }`}
                    >
                      Boys
                    </button>
                    <button
                      onClick={() => handleUniformGenderChange("girls")}
                      className={`px-3 py-1 rounded text-sm ${
                        uniformGender === "girls" ? "bg-blue-600 text-white" : "bg-gray-100"
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
        </>
      )}

      {/* Receipt Modal */}
      {showReceipt && (
        <ReceiptModal
          student={student}
          feeHeads={feeHeads}
          uniformItems={uniformItems}
          selectedUniformItems={selectedUniformItems}
          paymentAmount={paymentAmount}
          paymentMethod={paymentMethod}
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
          <div className="text-center border-b pb-4">
            <h3 className="text-lg font-bold">SPS Accounts</h3>
            <p className="text-sm text-gray-500">Fee Payment Receipt</p>
          </div>

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
              <span className="ml-2">{new Date().toLocaleDateString()}</span>
            </div>
          </div>

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

          <div className="border-t pt-4">
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Amount:</span>
              <span>₹{paymentAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Method:</span>
              <span className="capitalize">{paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Balance Due:</span>
              <span>₹{(total - parseFloat(paymentAmount)).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded-md text-sm">
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