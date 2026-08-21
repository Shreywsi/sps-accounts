/* ======================================================================
   SchoolAccounts.jsx  —  MAIN APP
   This is the only file with state. It owns:
     - loading/saving data for both ledgers (via storage.js)
     - the operator/admin role switch
     - add / direct-edit / delete logic
     - the change-request + approval workflow
     - filters, sorting, CSV export
   Everything visual is imported from ./components/*, everything fixed
   (categories, labels, formatting) is imported from ./constants.js.
   ====================================================================== */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus, Search, Pencil, Trash2, Check, Lock, Settings, X,
  TrendingUp, TrendingDown, Wallet, Landmark, Clock3,
  Download, ShieldCheck, UserCog, AlertTriangle, RotateCcw, BookOpen,
  GraduationCap, Building2, Send, BellRing,
} from "lucide-react";

import { DEFAULT_CATEGORIES, LEDGER_META, emptyForm, inr, uid, nowIso, formatDate } from "./constants";
import { loadAllLedgers, saveTransactions, saveCategories } from "./storage";
import { Modal } from "./components/Modal";
import { EntryFields } from "./components/EntryFields";
import { CategoryColumn } from "./components/CategoryColumn";
import { SummaryCard, StatusBadge, ResolvedBadge, Th } from "./components/Badges";
import { ApprovalsPanel } from "./components/ApprovalsPanel";

const LEDGER_ICONS = { student: GraduationCap, general: Building2 };

export default function SchoolAccounts() {
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  const [data, setData] = useState({
    student: { transactions: [], categories: DEFAULT_CATEGORIES.student },
    general: { transactions: [], categories: DEFAULT_CATEGORIES.general },
  });

  const [activeTab, setActiveTab] = useState("student"); // 'student' | 'general' | 'approvals'
  const [role, setRole] = useState("operator");
  const [userName, setUserName] = useState("");

  const [entryModal, setEntryModal] = useState(null); // { ledger, editingId }
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState("");

  const [crModal, setCrModal] = useState(null); // { ledger, txnId, kind: 'edit'|'delete' }
  const [crForm, setCrForm] = useState(emptyForm());
  const [crReason, setCrReason] = useState("");
  const [crError, setCrError] = useState("");

  const [reviewNote, setReviewNote] = useState({}); // { [txnId]: note }

  const [catModal, setCatModal] = useState(false);
  const [newIncomeCat, setNewIncomeCat] = useState("");
  const [newExpenseCat, setNewExpenseCat] = useState("");

  const [confirmDelete, setConfirmDelete] = useState(null); // { ledger, id }
  const [confirmReset, setConfirmReset] = useState(null); // ledger

  const [filters, setFilters] = useState({ search: "", type: "all", status: "all", category: "all", from: "", to: "" });
  const [sort, setSort] = useState({ key: "date", dir: "desc" });

  /* ---------------- load ---------------- */

  useEffect(() => {
    (async () => {
      try {
        const next = await loadAllLedgers();
        setData(next);
        setLoaded(true);
      } catch (e) {
        console.error(e);
        setLoadError(true);
        setLoaded(true);
      }
    })();
  }, []);

  const persistTx = useCallback(async (ledger, nextTx) => {
    setData((d) => ({ ...d, [ledger]: { ...d[ledger], transactions: nextTx } }));
    setSaving(true);
    try {
      await saveTransactions(ledger, nextTx);
    } catch (e) {
      console.error("save failed", e);
    } finally {
      setSaving(false);
    }
  }, []);

  const persistCat = useCallback(async (ledger, nextCats) => {
    setData((d) => ({ ...d, [ledger]: { ...d[ledger], categories: nextCats } }));
    try {
      await saveCategories(ledger, nextCats);
    } catch (e) {
      console.error("save failed", e);
    }
  }, []);

  /* ---------------- derived ---------------- */

  const currentLedger = activeTab === "approvals" ? null : activeTab;
  const txns = currentLedger ? data[currentLedger].transactions : [];
  const cats = currentLedger ? data[currentLedger].categories : { income: [], expense: [] };
  const meta = currentLedger ? LEDGER_META[currentLedger] : null;

  const totals = useMemo(() => {
    let income = 0, expense = 0, cash = 0, bank = 0, pending = 0;
    for (const t of txns) {
      const amt = Number(t.amount) || 0;
      const sign = t.type === "income" ? 1 : -1;
      if (t.type === "income") income += amt; else expense += amt;
      if (t.mode === "Cash") cash += sign * amt; else bank += sign * amt;
      if (t.status === "pending") pending += 1;
    }
    return { income, expense, net: income - expense, cash, bank, pending };
  }, [txns]);

  const filtered = useMemo(() => {
    let rows = txns.filter((t) => {
      if (filters.type !== "all" && t.type !== filters.type) return false;
      if (filters.status !== "all" && t.status !== filters.status) return false;
      if (filters.category !== "all" && t.category !== filters.category) return false;
      if (filters.from && t.date < filters.from) return false;
      if (filters.to && t.date > filters.to) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hay = `${t.party} ${t.category} ${t.remarks} ${t.className || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    rows.sort((a, b) => {
      let av = a[sort.key], bv = b[sort.key];
      if (sort.key === "amount") { av = Number(av); bv = Number(bv); }
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [txns, filters, sort]);

  const allCategoryNames = useMemo(() => [...cats.income, ...cats.expense], [cats]);

  const pendingApprovals = useMemo(() => {
    const out = [];
    for (const ledger of ["student", "general"]) {
      for (const t of data[ledger].transactions) {
        if (t.changeRequest && t.changeRequest.status === "pending") out.push({ ledger, txn: t });
      }
    }
    out.sort((a, b) => (a.txn.changeRequest.requestedAt < b.txn.changeRequest.requestedAt ? 1 : -1));
    return out;
  }, [data]);

  /* ---------------- permissions ---------------- */

  const displayName = () => userName.trim() || (role === "admin" ? "Admin" : "Operator");
  const canEditDirectly = (t) => role === "admin" || t.status === "pending";
  const hasPendingRequest = (t) => t.changeRequest && t.changeRequest.status === "pending";

  /* ---------------- filter/sort/tab helpers ---------------- */

  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  const switchTab = (tab) => {
    setActiveTab(tab);
    setFilters({ search: "", type: "all", status: "all", category: "all", from: "", to: "" });
  };

  /* ---------------- entry add / direct edit ---------------- */

  const openAdd = () => {
    setForm(emptyForm());
    setFormError("");
    setEntryModal({ ledger: currentLedger, editingId: null });
  };

  const openEditDirect = (t) => {
    setForm({
      date: t.date, type: t.type, category: t.category, party: t.party,
      className: t.className || "", mode: t.mode, amount: String(t.amount), remarks: t.remarks || "",
    });
    setFormError("");
    setEntryModal({ ledger: currentLedger, editingId: t.id });
  };

  const submitEntryForm = async () => {
    if (!form.date || !form.type || !form.category || !form.amount || !form.party) {
      setFormError(`Date, type, category, amount and ${currentLedger === "student" ? "student name" : "party"} are required.`);
      return;
    }
    if (Number(form.amount) <= 0 || isNaN(Number(form.amount))) {
      setFormError("Amount must be a positive number.");
      return;
    }
    const { ledger, editingId } = entryModal;
    const name = displayName();
    const txnsNow = data[ledger].transactions;

    if (editingId) {
      const next = txnsNow.map((t) =>
        t.id === editingId ? { ...t, ...form, amount: Number(form.amount), editedBy: name, editedAt: nowIso() } : t
      );
      await persistTx(ledger, next);
    } else {
      const newTx = {
        id: uid(), ledger, ...form, amount: Number(form.amount),
        status: "pending", enteredBy: name, enteredAt: nowIso(),
        checkedBy: null, checkedAt: null, changeRequest: null,
      };
      await persistTx(ledger, [newTx, ...txnsNow]);
    }
    setEntryModal(null);
  };

  const doDeleteDirect = async (ledger, id) => {
    await persistTx(ledger, data[ledger].transactions.filter((t) => t.id !== id));
    setConfirmDelete(null);
  };

  const toggleStatus = async (t) => {
    const name = displayName();
    const next = data[currentLedger].transactions.map((row) =>
      row.id === t.id
        ? row.status === "pending"
          ? { ...row, status: "checked", checkedBy: name, checkedAt: nowIso() }
          : { ...row, status: "pending", checkedBy: null, checkedAt: null }
        : row
    );
    await persistTx(currentLedger, next);
  };

  /* ---------------- operator change / delete requests ---------------- */

  const openChangeRequest = (t, kind) => {
    setCrForm({
      date: t.date, type: t.type, category: t.category, party: t.party,
      className: t.className || "", mode: t.mode, amount: String(t.amount), remarks: t.remarks || "",
    });
    setCrReason("");
    setCrError("");
    setCrModal({ ledger: currentLedger, txnId: t.id, kind });
  };

  const submitChangeRequest = async () => {
    if (!crReason.trim()) {
      setCrError("Please briefly explain why this change is needed — the admin will see this note.");
      return;
    }
    if (crModal.kind === "edit") {
      if (!crForm.date || !crForm.type || !crForm.category || !crForm.amount || !crForm.party) {
        setCrError("Please fill in date, type, category, amount and the required name/description field.");
        return;
      }
      if (Number(crForm.amount) <= 0 || isNaN(Number(crForm.amount))) {
        setCrError("Amount must be a positive number.");
        return;
      }
    }
    const { ledger, txnId, kind } = crModal;
    const name = displayName();
    const request = {
      id: uid(), kind,
      proposed: kind === "edit" ? { ...crForm, amount: Number(crForm.amount) } : null,
      reason: crReason.trim(), requestedBy: name, requestedAt: nowIso(), status: "pending",
    };
    const next = data[ledger].transactions.map((t) => (t.id === txnId ? { ...t, changeRequest: request } : t));
    await persistTx(ledger, next);
    setCrModal(null);
  };

  const resolveRequest = async (ledger, txnId, decision) => {
    const note = (reviewNote[txnId] || "").trim();
    const name = displayName();
    const txnsNow = data[ledger].transactions;
    const target = txnsNow.find((t) => t.id === txnId);
    if (!target || !target.changeRequest) return;
    const request = target.changeRequest;

    if (decision === "approve" && request.kind === "delete") {
      await persistTx(ledger, txnsNow.filter((t) => t.id !== txnId));
    } else if (decision === "approve" && request.kind === "edit") {
      const next = txnsNow.map((t) =>
        t.id === txnId
          ? {
              ...t, ...request.proposed, editedBy: request.requestedBy, editedAt: request.requestedAt,
              changeRequest: null,
              lastResolvedRequest: { ...request, status: "approved", resolvedBy: name, resolvedAt: nowIso(), adminNote: note },
            }
          : t
      );
      await persistTx(ledger, next);
    } else {
      const next = txnsNow.map((t) =>
        t.id === txnId
          ? { ...t, changeRequest: null, lastResolvedRequest: { ...request, status: "rejected", resolvedBy: name, resolvedAt: nowIso(), adminNote: note } }
          : t
      );
      await persistTx(ledger, next);
    }
    setReviewNote((r) => { const n = { ...r }; delete n[txnId]; return n; });
  };

  const dismissResolution = async (ledger, txnId) => {
    const next = data[ledger].transactions.map((t) => (t.id === txnId ? { ...t, lastResolvedRequest: null } : t));
    await persistTx(ledger, next);
  };

  /* ---------------- categories ---------------- */

  const addCategory = async (kind) => {
    const val = (kind === "income" ? newIncomeCat : newExpenseCat).trim();
    if (!val) return;
    if (allCategoryNames.some((c) => c.toLowerCase() === val.toLowerCase())) {
      if (kind === "income") setNewIncomeCat(""); else setNewExpenseCat("");
      return;
    }
    const next = { ...cats, [kind]: [...cats[kind], val] };
    await persistCat(currentLedger, next);
    if (kind === "income") setNewIncomeCat(""); else setNewExpenseCat("");
  };

  const deleteCategory = async (kind, name) => {
    const next = { ...cats, [kind]: cats[kind].filter((c) => c !== name) };
    await persistCat(currentLedger, next);
  };

  const resetLedger = async (ledger) => {
    await persistTx(ledger, []);
    await persistCat(ledger, DEFAULT_CATEGORIES[ledger]);
    setConfirmReset(null);
  };

  const exportCsv = () => {
    const headers = currentLedger === "student"
      ? ["Date", "Type", "Category", "Student Name", "Class", "Mode", "Amount", "Status", "Entered By", "Checked By", "Remarks"]
      : ["Date", "Type", "Category", meta.partyLabel, "Mode", "Amount", "Status", "Entered By", "Checked By", "Remarks"];
    const rows = filtered.map((t) => {
      const base = [t.date, t.type, t.category, t.party];
      if (currentLedger === "student") base.push(t.className || "");
      base.push(t.mode, t.amount, t.status, t.enteredBy, t.checkedBy || "", (t.remarks || "").replace(/,/g, ";"));
      return base;
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c ?? "")}"`).join(",")).join("\n");
    try {
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentLedger}-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("export failed", e);
    }
  };

  /* ---------------- render ---------------- */

  if (!loaded) {
    return <div className="min-h-[400px] flex items-center justify-center bg-slate-50 text-slate-500">Loading accounts…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-slate-900 text-slate-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-md bg-amber-500 flex items-center justify-center shrink-0">
              <BookOpen size={18} className="text-slate-900" />
            </div>
            <div>
              <h1 className="font-serif text-lg sm:text-xl leading-tight tracking-tight">School Accounts</h1>
              <p className="text-[11px] text-slate-400 leading-tight">Fees &amp; general ledger, kept separate</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your name"
              className="w-28 sm:w-36 bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex rounded-md overflow-hidden border border-slate-700">
              <button
                onClick={() => setRole("operator")}
                className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${role === "operator" ? "bg-amber-500 text-slate-900 font-medium" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
              >
                <UserCog size={14} /> Operator
              </button>
              <button
                onClick={() => setRole("admin")}
                className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${role === "admin" ? "bg-amber-500 text-slate-900 font-medium" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
              >
                <ShieldCheck size={14} /> Admin
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-3 flex items-center gap-1 border-b border-slate-800 overflow-x-auto">
          {["student", "general"].map((key) => {
            const Icon = LEDGER_ICONS[key];
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => switchTab(key)}
                className={`px-3.5 py-2.5 text-sm flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${active ? "border-amber-500 text-white" : "border-transparent text-slate-400 hover:text-slate-200"}`}
              >
                <Icon size={15} /> {LEDGER_META[key].short}
              </button>
            );
          })}
          {role === "admin" && (
            <button
              onClick={() => switchTab("approvals")}
              className={`px-3.5 py-2.5 text-sm flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${activeTab === "approvals" ? "border-amber-500 text-white" : "border-transparent text-slate-400 hover:text-slate-200"}`}
            >
              <BellRing size={15} /> Approvals
              {pendingApprovals.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold">
                  {pendingApprovals.length}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {loadError && (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-md px-3 py-2">
            <AlertTriangle size={16} /> Couldn't load saved data. Starting fresh — changes will still save going forward.
          </div>
        )}

        {activeTab === "approvals" ? (
          <ApprovalsPanel
            pendingApprovals={pendingApprovals}
            reviewNote={reviewNote}
            setReviewNote={setReviewNote}
            resolveRequest={resolveRequest}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <SummaryCard icon={<TrendingUp size={16} />} label="Total Income" value={inr(totals.income)} tone="emerald" />
              <SummaryCard icon={<TrendingDown size={16} />} label="Total Expense" value={inr(totals.expense)} tone="rose" />
              <SummaryCard icon={<Wallet size={16} />} label="Net Balance" value={inr(totals.net)} tone={totals.net >= 0 ? "slate" : "rose"} />
              <SummaryCard icon={<Landmark size={16} />} label="Cash / Bank" value={`${inr(totals.cash)} · ${inr(totals.bank)}`} tone="indigo" small />
              <SummaryCard icon={<Clock3 size={16} />} label="Pending Review" value={totals.pending} tone="amber" />
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center gap-2">
              <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-slate-900 text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-slate-800 transition-colors">
                <Plus size={16} /> Add Entry
              </button>

              <div className="relative flex-1 min-w-[160px]">
                <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  placeholder={currentLedger === "student" ? "Search student, category, remarks…" : "Search party, category, remarks…"}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value, category: "all" }))}
                className="text-sm border border-slate-200 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="all">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>

              <select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                className="text-sm border border-slate-200 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 max-w-[160px]">
                <option value="all">All categories</option>
                {(filters.type === "expense" ? cats.expense : filters.type === "income" ? cats.income : allCategoryNames).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                className="text-sm border border-slate-200 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="checked">Checked</option>
              </select>

              <input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
                className="text-sm border border-slate-200 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500" />
              <span className="text-slate-400 text-sm">to</span>
              <input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
                className="text-sm border border-slate-200 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500" />

              <button onClick={() => setCatModal(true)} className="inline-flex items-center gap-1.5 text-sm border border-slate-200 px-3 py-2 rounded-md hover:bg-slate-50 text-slate-600">
                <Settings size={14} /> Categories
              </button>
              <button onClick={exportCsv} className="inline-flex items-center gap-1.5 text-sm border border-slate-200 px-3 py-2 rounded-md hover:bg-slate-50 text-slate-600">
                <Download size={14} /> Export CSV
              </button>

              {role === "admin" && (
                <button onClick={() => setConfirmReset(currentLedger)} className="inline-flex items-center gap-1.5 text-sm border border-slate-200 px-3 py-2 rounded-md hover:bg-rose-50 text-rose-500 ml-auto">
                  <RotateCcw size={14} /> Reset this ledger
                </button>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[920px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-500 text-xs uppercase tracking-wide">
                      <Th label="Date" sortKey="date" sort={sort} onSort={toggleSort} />
                      <th className="px-3 py-2.5 font-medium">Type</th>
                      <th className="px-3 py-2.5 font-medium">Category</th>
                      <th className="px-3 py-2.5 font-medium">{meta.partyLabel}</th>
                      {currentLedger === "student" && <th className="px-3 py-2.5 font-medium">Class</th>}
                      <th className="px-3 py-2.5 font-medium">Mode</th>
                      <Th label="Amount" sortKey="amount" sort={sort} onSort={toggleSort} right />
                      <th className="px-3 py-2.5 font-medium">Status</th>
                      <th className="px-3 py-2.5 font-medium">Entered By</th>
                      <th className="px-3 py-2.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={currentLedger === "student" ? 10 : 9} className="px-3 py-10 text-center text-slate-400">
                          No entries match these filters. Add an entry or adjust the filters above.
                        </td>
                      </tr>
                    )}
                    {filtered.map((t) => (
                      <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 align-top">
                        <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">{formatDate(t.date)}</td>
                        <td className="px-3 py-2.5">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.type === "income" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                            {t.type === "income" ? "Income" : "Expense"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">{t.category}</td>
                        <td className="px-3 py-2.5 text-slate-700">
                          <div>{t.party}</div>
                          {t.remarks && <div className="text-xs text-slate-400">{t.remarks}</div>}
                        </td>
                        {currentLedger === "student" && <td className="px-3 py-2.5 text-slate-600">{t.className || "—"}</td>}
                        <td className="px-3 py-2.5 text-slate-600">{t.mode}</td>
                        <td className={`px-3 py-2.5 text-right font-medium tabular-nums ${t.type === "income" ? "text-emerald-700" : "text-rose-700"}`}>
                          {t.type === "income" ? "+" : "−"}{inr(t.amount)}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col gap-1 items-start">
                            <StatusBadge status={t.status} />
                            {hasPendingRequest(t) && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                <Clock3 size={10} /> {t.changeRequest.kind === "delete" ? "Delete requested" : "Change requested"}
                              </span>
                            )}
                            {t.lastResolvedRequest && (
                              <ResolvedBadge request={t.lastResolvedRequest} onDismiss={() => dismissResolution(currentLedger, t.id)} />
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 text-xs">
                          <div>{t.enteredBy}</div>
                          {t.status === "checked" && t.checkedBy && <div className="text-emerald-600">✓ {t.checkedBy}</div>}
                          {t.editedBy && <div className="text-slate-400">edited by {t.editedBy}</div>}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            {role === "admin" && (
                              <button
                                onClick={() => toggleStatus(t)}
                                title={t.status === "pending" ? "Mark as checked" : "Reopen (unlock)"}
                                className={`p-1.5 rounded-md hover:bg-slate-100 ${t.status === "pending" ? "text-emerald-600" : "text-amber-600"}`}
                              >
                                {t.status === "pending" ? <Check size={15} /> : <Lock size={15} />}
                              </button>
                            )}

                            {canEditDirectly(t) ? (
                              <>
                                <button onClick={() => openEditDirect(t)} title="Edit entry" className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500">
                                  <Pencil size={15} />
                                </button>
                                <button onClick={() => setConfirmDelete({ ledger: currentLedger, id: t.id })} title="Delete entry" className="p-1.5 rounded-md hover:bg-rose-50 text-rose-500">
                                  <Trash2 size={15} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => !hasPendingRequest(t) && openChangeRequest(t, "edit")}
                                  disabled={hasPendingRequest(t)}
                                  title={hasPendingRequest(t) ? "A request is already awaiting admin review" : "Request a change from the admin"}
                                  className={`p-1.5 rounded-md ${hasPendingRequest(t) ? "text-slate-300 cursor-not-allowed" : "hover:bg-amber-50 text-amber-600"}`}
                                >
                                  <Send size={15} />
                                </button>
                                <button
                                  onClick={() => !hasPendingRequest(t) && openChangeRequest(t, "delete")}
                                  disabled={hasPendingRequest(t)}
                                  title={hasPendingRequest(t) ? "A request is already awaiting admin review" : "Request deletion from the admin"}
                                  className={`p-1.5 rounded-md ${hasPendingRequest(t) ? "text-slate-300 cursor-not-allowed" : "hover:bg-rose-50 text-rose-400"}`}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>{filtered.length} of {txns.length} entries</span>
                <span>{saving ? "Saving…" : "All changes saved"}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Operators can add entries and freely edit or delete their own <strong>pending</strong> ones. Once an admin marks
              an entry <strong>checked</strong>, it locks — an operator who needs a change or deletion must send a request,
              which appears under the admin's <strong>Approvals</strong> tab for a decision.
            </p>
          </>
        )}
      </main>

      {entryModal && (
        <Modal onClose={() => setEntryModal(null)} title={entryModal.editingId ? "Edit Entry" : `Add Entry — ${LEDGER_META[entryModal.ledger].short}`}>
          <EntryFields ledger={entryModal.ledger} form={form} setForm={setForm} categories={data[entryModal.ledger].categories} />
          {formError && <p className="text-rose-500 text-xs mt-3">{formError}</p>}
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setEntryModal(null)} className="px-3.5 py-2 text-sm rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={submitEntryForm} className="px-3.5 py-2 text-sm rounded-md bg-slate-900 text-white hover:bg-slate-800">
              {entryModal.editingId ? "Save changes" : "Add entry"}
            </button>
          </div>
        </Modal>
      )}

      {crModal && (
        <Modal onClose={() => setCrModal(null)} title={crModal.kind === "delete" ? "Request Deletion" : "Request a Change"}>
          <p className="text-xs text-slate-500 mb-3">
            This entry has already been checked by an admin, so it's locked. Your request will be sent for approval —
            nothing changes until the admin accepts it.
          </p>
          {crModal.kind === "edit" && (
            <EntryFields ledger={crModal.ledger} form={crForm} setForm={setCrForm} categories={data[crModal.ledger].categories} />
          )}
          <label className="block mt-3">
            <span className="block text-xs font-medium text-slate-500 mb-1">Reason for this request</span>
            <textarea
              value={crReason}
              onChange={(e) => setCrReason(e.target.value)}
              rows={3}
              placeholder="e.g. Amount was entered wrong, should be ₹1,500 not ₹15,000"
              className="w-full border border-slate-200 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </label>
          {crError && <p className="text-rose-500 text-xs mt-2">{crError}</p>}
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setCrModal(null)} className="px-3.5 py-2 text-sm rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={submitChangeRequest} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-md bg-amber-500 text-slate-900 font-medium hover:bg-amber-400">
              <Send size={14} /> Send to admin
            </button>
          </div>
        </Modal>
      )}

      {catModal && currentLedger && (
        <Modal onClose={() => setCatModal(false)} title={`Manage Categories — ${meta.short}`} wide>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <CategoryColumn title="Income categories" tone="emerald" items={cats.income}
              value={newIncomeCat} onChange={setNewIncomeCat} onAdd={() => addCategory("income")} onDelete={(c) => deleteCategory("income", c)} />
            <CategoryColumn title="Expense categories" tone="rose" items={cats.expense}
              value={newExpenseCat} onChange={setNewExpenseCat} onAdd={() => addCategory("expense")} onDelete={(c) => deleteCategory("expense", c)} />
          </div>
          <div className="flex justify-end mt-5">
            <button onClick={() => setCatModal(false)} className="px-3.5 py-2 text-sm rounded-md bg-slate-900 text-white hover:bg-slate-800">Done</button>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(null)} title="Delete entry?" small>
          <p className="text-sm text-slate-600">This permanently removes the entry from the ledger. This can't be undone.</p>
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setConfirmDelete(null)} className="px-3.5 py-2 text-sm rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={() => doDeleteDirect(confirmDelete.ledger, confirmDelete.id)} className="px-3.5 py-2 text-sm rounded-md bg-rose-600 text-white hover:bg-rose-700">Delete</button>
          </div>
        </Modal>
      )}

      {confirmReset && (
        <Modal onClose={() => setConfirmReset(null)} title="Reset this ledger?" small>
          <p className="text-sm text-slate-600">
            This deletes every entry in the <strong>{LEDGER_META[confirmReset].short}</strong> ledger and restores its
            default categories, for everyone using this app. The other ledger is not affected. This can't be undone.
          </p>
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setConfirmReset(null)} className="px-3.5 py-2 text-sm rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={() => resetLedger(confirmReset)} className="px-3.5 py-2 text-sm rounded-md bg-rose-600 text-white hover:bg-rose-700">Reset ledger</button>
          </div>
        </Modal>
      )}
    </div>
  );
}