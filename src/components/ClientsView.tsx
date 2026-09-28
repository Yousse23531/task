import { useMemo, useState } from 'react';
import {
  Users,
  Plus,
  MapPin,
  Pencil,
  Trash2,
  Calendar,
  TrendingUp,
  Search,
  X,
  User,
  Link2,
  Phone,
  Mail,
  MessageSquare,
} from 'lucide-react';
import type { Client, Task } from '@/lib/types';
import { formatCurrency, formatDate, generateId } from '@/lib/utils';

interface ClientsViewProps {
  clients: Client[];
  tasks: Task[];
  onSaveClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onAddTaskForClient: (client: Client) => void;
}

export default function ClientsView({
  clients,
  tasks,
  onSaveClient,
  onDeleteClient,
  onAddTaskForClient,
}: ClientsViewProps) {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [location, setLocation] = useState('');
  const [comments, setComments] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>(['']);
  const [emails, setEmails] = useState<string[]>(['']);

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const query = search.toLowerCase();
    return clients.filter((c) => {
      const full = `${c.name} ${c.surname} ${(c.phoneNumbers || []).join(' ')} ${(c.emails || []).join(' ')} ${c.comments || ''}`.toLowerCase();
      return full.includes(query);
    });
  }, [clients, search]);

  function openNew() {
    setEditingClient(null);
    setName('');
    setSurname('');
    setLocation('');
    setComments('');
    setPhoneNumbers(['']);
    setEmails(['']);
    setShowForm(true);
  }

  function openEdit(client: Client) {
    setEditingClient(client);
    setName(client.name);
    setSurname(client.surname);
    setLocation(client.location || '');
    setComments(client.comments || '');
    setPhoneNumbers(
      client.phoneNumbers && client.phoneNumbers.length > 0 ? [...client.phoneNumbers] : ['']
    );
    setEmails(
      client.emails && client.emails.length > 0 ? [...client.emails] : ['']
    );
    setShowForm(true);
  }

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

  function handleSave() {
    if (!name.trim()) return;
    const cleanPhones = phoneNumbers.map((p) => p.trim()).filter(Boolean);
    const cleanEmails = emails.map((e) => e.trim()).filter(Boolean);
    const client: Client = {
      id: editingClient?.id || generateId(),
      name: name.trim(),
      surname: surname.trim(),
      phoneNumbers: cleanPhones,
      emails: cleanEmails,
      location: location.trim(),
      comments: comments.trim(),
      createdAt: editingClient?.createdAt || new Date().toISOString(),
    };
    onSaveClient(client);
    setShowForm(false);
    setEditingClient(null);
  }

  function getTaskCount(clientId: string): number {
    return tasks.filter((t) => t.clientId === clientId).length;
  }

  function getClientProfit(clientId: string): number {
    return tasks
      .filter((t) => t.clientId === clientId)
      .reduce((sum, t) => sum + t.profit, 0);
  }

  function getClientLastDate(clientId: string): string {
    const clientTasks = tasks.filter((t) => t.clientId === clientId);
    const dates = clientTasks
      .flatMap((t) => t.days.map((d) => d.date))
      .filter(Boolean)
      .sort();
    return dates[dates.length - 1] || '';
  }

  const inputClass = 'glass-input w-full rounded-xl px-4 py-2.5 text-sm text-white';
  const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-cyan-400" />
          <h2 className="text-lg font-bold text-white tracking-wide">Clients</h2>
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/15 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">
            {clients.length}
          </span>
        </div>
        <button
          onClick={openNew}
          className="glass-button-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white active:scale-95"
        >
          <Plus size={18} /> Add Client
        </button>
      </div>

      {clients.length > 0 && (
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="glass-input w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500"
          />
        </div>
      )}

      {clients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-16 text-center backdrop-blur-md">
          <Users size={36} className="mx-auto text-cyan-400/50" />
          <p className="mt-3 text-sm text-slate-400">No clients yet. Add clients to quickly reuse their info when creating tasks.</p>
          <button
            onClick={openNew}
            className="glass-button-primary mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          >
            <Plus size={18} /> Add First Client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredClients.map((client) => {
            const taskCount = getTaskCount(client.id);
            const profit = getClientProfit(client.id);
            const lastDate = getClientLastDate(client.id);

            return (
              <div
                key={client.id}
                className="glass-card rounded-2xl p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-white tracking-wide">
                      {client.name} {client.surname}
                    </h3>
                    {/* Phone numbers & Emails */}
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {client.phoneNumbers && client.phoneNumbers.map((phone, idx) => (
                        <a
                          key={`phone-${idx}`}
                          href={`tel:${phone}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs font-medium text-cyan-300 transition hover:border-cyan-500/40 hover:bg-cyan-500/15"
                          title="Call client"
                        >
                          <Phone size={11} className="text-cyan-400" />
                          {phone}
                        </a>
                      ))}
                      {client.emails && client.emails.map((email, idx) => (
                        <a
                          key={`email-${idx}`}
                          href={`mailto:${email}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs font-medium text-indigo-300 transition hover:border-indigo-500/40 hover:bg-indigo-500/15"
                          title="Email client"
                        >
                          <Mail size={11} className="text-indigo-400" />
                          {email}
                        </a>
                      ))}
                    </div>
                    {client.location && (
                      <a
                        href={client.location}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 inline-flex items-center gap-1 text-xs text-cyan-400 transition hover:text-cyan-300 hover:underline"
                      >
                        <MapPin size={11} /> Location
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(client)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-cyan-300"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(client.id)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-500/15 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={11} /> {taskCount} task{taskCount !== 1 ? 's' : ''}
                  </span>
                  {lastDate && (
                    <span className="inline-flex items-center gap-1">
                      Last: {formatDate(lastDate)}
                    </span>
                  )}
                  {taskCount > 0 && (
                    <span className={`inline-flex items-center gap-1 font-semibold ${profit > 0 ? 'text-emerald-300' : profit < 0 ? 'text-red-300' : 'text-slate-400'
                      }`}>
                      <TrendingUp size={11} /> {formatCurrency(profit)}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => onAddTaskForClient(client)}
                  className="mt-3 w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-2 text-xs font-semibold text-cyan-300 transition-all duration-200 hover:bg-cyan-500/20 hover:border-cyan-500/50"
                >
                  <Plus size={12} className="mr-1 inline" /> Add Task for This Client
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Client Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h2 className="text-lg font-bold text-white tracking-wide">
                {editingClient ? 'Edit Client' : 'New Client'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-xl p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
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
                    <Plus size={13} /> Add Number
                  </button>
                </div>
                <div className="space-y-2">
                  {phoneNumbers.map((phone, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        className={inputClass}
                        value={phone}
                        onChange={(e) => handlePhoneNumberChange(idx, e.target.value)}
                        placeholder={idx === 0 ? 'Phone number (e.g. +216 98 123 456)' : 'Another phone number'}
                        type="tel"
                      />
                      {phoneNumbers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePhoneNumberField(idx)}
                          className="rounded-xl p-2 text-slate-400 transition hover:bg-red-500/15 hover:text-red-400"
                          title="Remove phone number"
                        >
                          <Trash2 size={16} />
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
                    <Plus size={13} /> Add Email
                  </button>
                </div>
                <div className="space-y-2">
                  {emails.map((email, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        className={inputClass}
                        value={email}
                        onChange={(e) => handleEmailChange(idx, e.target.value)}
                        placeholder={idx === 0 ? 'Email address (e.g. client@example.com)' : 'Another email address'}
                        type="email"
                      />
                      {emails.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEmailField(idx)}
                          className="rounded-xl p-2 text-slate-400 transition hover:bg-red-500/15 hover:text-red-400"
                          title="Remove email"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>
                  <Link2 size={12} className="mr-1 inline text-slate-400" /> Location (link)
                </label>
                <input
                  className={inputClass}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  type="url"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim()}
                className="glass-button-primary rounded-xl px-6 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {editingClient ? 'Save' : 'Add Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="glass-panel w-full max-w-sm rounded-2xl border border-red-500/30 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white">Delete Client?</h3>
            <p className="mt-1 text-sm text-slate-400">
              The client will be removed. Their tasks will remain but won't be linked to a client.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteClient(deleteId);
                  setDeleteId(null);
                }}
                className="rounded-xl bg-red-600 border border-red-400/30 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
