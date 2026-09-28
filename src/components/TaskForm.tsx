import { useEffect, useState } from 'react';
import { X, Plus, Trash2, MapPin, User, Calendar, Users, Link2, Phone, Mail, DollarSign, Package } from 'lucide-react';
import type { Task, TaskDay, Client } from '@/lib/types';
import { generateId } from '@/lib/utils';

interface TaskFormProps {
  task: Task | null;
  clients: Client[];
  onSave: (task: Task) => void;
  onClose: () => void;
}

export default function TaskForm({ task, clients, onSave, onClose }: TaskFormProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>(['']);
  const [emails, setEmails] = useState<string[]>(['']);
  const [location, setLocation] = useState('');
  const [pack, setPack] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [cost, setCost] = useState('');
  const [advancePayment, setAdvancePayment] = useState('');
  const [days, setDays] = useState<TaskDay[]>([
    { id: generateId(), date: '', location: '', workDone: false, printingDone: false, comments: '' },
  ]);

  useEffect(() => {
    if (task) {
      setSelectedClientId(task.clientId || '');
      setName(task.name);
      setSurname(task.surname);
      setPhoneNumbers(
        task.phoneNumbers && task.phoneNumbers.length > 0 ? [...task.phoneNumbers] : ['']
      );
      setEmails(
        task.emails && task.emails.length > 0 ? [...task.emails] : ['']
      );
      setLocation(task.location || '');
      setPack(task.pack || '');
      setServicePrice(task.servicePrice ? String(task.servicePrice) : '');
      setCost(task.cost ? String(task.cost) : '');
      setAdvancePayment(task.advancePayment ? String(task.advancePayment) : '');
      setDays(
        task.days.length > 0
          ? task.days.map((d) => ({ ...d, location: d.location || '' }))
          : [{ id: generateId(), date: '', location: '', workDone: false, printingDone: false, comments: '' }]
      );
    }
  }, [task]);

  function handleClientSelect(id: string) {
    setSelectedClientId(id);
    if (id) {
      const client = clients.find((c) => c.id === id);
      if (client) {
        setName(client.name);
        setSurname(client.surname);
        setLocation(client.location || '');
        if (client.phoneNumbers && client.phoneNumbers.length > 0) {
          setPhoneNumbers([...client.phoneNumbers]);
        }
        if (client.emails && client.emails.length > 0) {
          setEmails([...client.emails]);
        }
      }
    }
  }

  const computedProfit = (() => {
    const sp = parseFloat(servicePrice) || 0;
    const c = parseFloat(cost) || 0;
    return sp - c;
  })();

  const remainingBalance = (() => {
    const sp = parseFloat(servicePrice) || 0;
    const adv = parseFloat(advancePayment) || 0;
    return sp - adv;
  })();

  function handlePhoneNumberChange(index: number, value: string) {
    setPhoneNumbers((prev) => prev.map((p, i) => (i === index ? value : p)));
  }

  function addPhoneNumberField() {
    setPhoneNumbers((prev) => [...prev, '']);
  }

  function removePhoneNumberField(index: number) {
    setPhoneNumbers((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : ['']));
  }

  function handleEmailChange(index: number, value: string) {
    setEmails((prev) => prev.map((e, i) => (i === index ? value : e)));
  }

  function addEmailField() {
    setEmails((prev) => [...prev, '']);
  }

  function removeEmailField(index: number) {
    setEmails((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : ['']));
  }

  function addDay() {
    setDays((prev) => [
      ...prev,
      { id: generateId(), date: '', location: '', workDone: false, printingDone: false, comments: '' },
    ]);
  }

  function removeDay(id: string) {
    setDays((prev) => (prev.length > 1 ? prev.filter((d) => d.id !== id) : prev));
  }

  function updateDay(id: string, field: keyof TaskDay, value: string | boolean) {
    setDays((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const cleanPhones = phoneNumbers.map((p) => p.trim()).filter(Boolean);
    const cleanEmails = emails.map((e) => e.trim()).filter(Boolean);
    const newTask: Task = {
      id: task?.id || generateId(),
      clientId: selectedClientId || null,
      name: name.trim(),
      surname: surname.trim(),
      phoneNumbers: cleanPhones,
      emails: cleanEmails,
      location: location.trim(),
      pack: pack.trim(),
      servicePrice: parseFloat(servicePrice) || 0,
      cost: parseFloat(cost) || 0,
      advancePayment: parseFloat(advancePayment) || 0,
      profit: computedProfit,
      days: days.filter((d) => d.date !== ''),
      workDone: task?.workDone ?? false,
      workSent: task?.workSent ?? false,
      printingDone: task?.printingDone ?? false,
      cancelled: task?.cancelled ?? false,
      createdAt: task?.createdAt || new Date().toISOString(),
    };
    onSave(newTask);
  }

  const inputClass = 'glass-input w-full rounded-xl px-4 py-2.5 text-sm text-white';
  const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md sm:p-6">
      <div className="glass-panel my-4 w-full max-w-3xl rounded-2xl border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-bold text-white tracking-wide">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 transition-all duration-200 hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {/* Client selection */}
          {clients.length > 0 && (
            <div className="mb-4 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4 backdrop-blur-md">
              <label className={labelClass}>
                <Users size={12} className="mr-1 inline text-cyan-400" /> Select Existing Client
              </label>
              <select
                className={inputClass}
                value={selectedClientId}
                onChange={(e) => handleClientSelect(e.target.value)}
              >
                <option value="" className="bg-neutral-900 text-white">— New client (fill manually) —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id} className="bg-neutral-900 text-white">
                    {c.name} {c.surname}
                  </option>
                ))}
              </select>
              {selectedClientId && (
                <p className="mt-2 text-xs text-cyan-400">
                  Client details auto-filled. You can still edit them for this task.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>
                <User size={12} className="mr-1 inline text-slate-400" /> Name
              </label>
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First name"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Surname</label>
              <input
                className={inputClass}
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>

          {/* Phone Numbers & Emails */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Phone Numbers */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass}>
                  <Phone size={12} className="mr-1 inline text-slate-400" /> Phone Numbers
                </label>
                <button
                  type="button"
                  onClick={addPhoneNumberField}
                  className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
                >
                  <Plus size={13} /> Add
                </button>
              </div>
              <div className="space-y-2">
                {phoneNumbers.map((phone, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      className={inputClass}
                      value={phone}
                      onChange={(e) => handlePhoneNumberChange(idx, e.target.value)}
                      placeholder={idx === 0 ? 'e.g. +216 98 123 456' : 'Additional phone'}
                      type="tel"
                    />
                    {phoneNumbers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePhoneNumberField(idx)}
                        className="rounded-xl p-2 text-slate-400 transition hover:bg-red-500/15 hover:text-red-400"
                        title="Remove phone number"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Email Addresses */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass}>
                  <Mail size={12} className="mr-1 inline text-slate-400" /> Email Addresses
                </label>
                <button
                  type="button"
                  onClick={addEmailField}
                  className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
                >
                  <Plus size={13} /> Add
                </button>
              </div>
              <div className="space-y-2">
                {emails.map((email, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      className={inputClass}
                      value={email}
                      onChange={(e) => handleEmailChange(idx, e.target.value)}
                      placeholder={idx === 0 ? 'e.g. client@example.com' : 'Additional email'}
                      type="email"
                    />
                    {emails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEmailField(idx)}
                        className="rounded-xl p-2 text-slate-400 transition hover:bg-red-500/15 hover:text-red-400"
                        title="Remove email"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>
                <Package size={12} className="mr-1 inline text-cyan-400" /> Package / Pack
              </label>
              <input
                className={inputClass}
                value={pack}
                onChange={(e) => setPack(e.target.value)}
                placeholder="e.g. VIP Pack, Silver, Wedding Pack 2"
                type="text"
              />
            </div>
            <div>
              <label className={labelClass}>
                <Link2 size={12} className="mr-1 inline text-slate-400" /> General Location (link / address)
              </label>
              <input
                className={inputClass}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="https://maps.google.com/... or Venue"
                type="text"
              />
            </div>
          </div>

          {/* Financials with Advance Payment */}
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <h3 className="mb-3 text-sm font-bold text-cyan-300">Financials (Tunisian Dinar)</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className={labelClass}>Service Price</label>
                <input
                  className={inputClass}
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                  placeholder="0"
                  type="number"
                  step="0.001"
                  min="0"
                />
              </div>
              <div>
                <label className={labelClass}>
                  <DollarSign size={11} className="mr-1 inline text-amber-400" /> Advance Payment
                </label>
                <input
                  className={inputClass}
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(e.target.value)}
                  placeholder="0"
                  type="number"
                  step="0.001"
                  min="0"
                />
              </div>
              <div>
                <label className={labelClass}>Cost</label>
                <input
                  className={inputClass}
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0"
                  type="number"
                  step="0.001"
                  min="0"
                />
              </div>
              <div>
                <label className={labelClass}>Remaining Balance</label>
                <div
                  className={`flex items-center rounded-xl border px-3 py-2.5 text-xs font-semibold backdrop-blur-md ${
                    remainingBalance > 0
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                      : remainingBalance === 0 && parseFloat(servicePrice) > 0
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/10 bg-white/[0.03] text-slate-400'
                  }`}
                >
                  {remainingBalance.toFixed(3)} DT
                  {remainingBalance === 0 && parseFloat(servicePrice) > 0 && (
                    <span className="ml-1 text-[10px] text-emerald-400">(Paid)</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5 text-xs">
              <span className="text-slate-400">Net Estimated Profit:</span>
              <span className={`font-bold ${computedProfit > 0 ? 'text-emerald-300' : computedProfit < 0 ? 'text-red-300' : 'text-white'}`}>
                {computedProfit.toFixed(3)} DT
              </span>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-cyan-300">
                  <Calendar size={14} className="mr-1.5 inline" /> Event Days
                </h3>
                <p className="text-[11px] text-slate-400">Each date can have its own dedicated location link or venue.</p>
              </div>
              <button
                type="button"
                onClick={addDay}
                className="flex items-center gap-1 rounded-xl border border-cyan-500/30 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/25"
              >
                <Plus size={14} /> Add Day
              </button>
            </div>

            <div className="space-y-3">
              {days.map((day, idx) => (
                <div key={day.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Day {idx + 1}
                    </span>
                    {days.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDay(day.id)}
                        className="rounded-lg p-1 text-slate-500 transition hover:bg-red-500/15 hover:text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className={labelClass}>Date</label>
                      <input
                        type="date"
                        className={inputClass}
                        value={day.date}
                        onChange={(e) => updateDay(day.id, 'date', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        <MapPin size={11} className="mr-1 inline text-cyan-400" /> Day Location
                      </label>
                      <input
                        className={inputClass}
                        value={day.location || ''}
                        onChange={(e) => updateDay(day.id, 'location', e.target.value)}
                        placeholder="Location link / Hall name"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Comments</label>
                      <input
                        className={inputClass}
                        value={day.comments}
                        onChange={(e) => updateDay(day.id, 'comments', e.target.value)}
                        placeholder="Optional notes"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3">
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs transition-all duration-200 hover:bg-white/[0.08]">
                      <input
                        type="checkbox"
                        checked={day.workDone}
                        onChange={(e) => updateDay(day.id, 'workDone', e.target.checked)}
                        className="h-4 w-4 rounded border-white/20 bg-black/50 accent-cyan-500"
                      />
                      <span className="font-medium text-slate-200">Work Done</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs transition-all duration-200 hover:bg-white/[0.08]">
                      <input
                        type="checkbox"
                        checked={day.printingDone}
                        onChange={(e) => updateDay(day.id, 'printingDone', e.target.checked)}
                        className="h-4 w-4 rounded border-white/20 bg-black/50 accent-cyan-500"
                      />
                      <span className="font-medium text-slate-200">Printing Done</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="glass-button-primary rounded-xl px-6 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {task ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
