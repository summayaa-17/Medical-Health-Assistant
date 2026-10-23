'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SinglyLinkedList, type SymptomRecord } from '@/lib/SinglyLinkedList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Trash2, Plus, Activity, HeartPulse, Info } from 'lucide-react';

const STORAGE_KEY = 'meditrack-symptoms-v1';

const SAMPLE_RECORDS: SymptomRecord[] = [
  { id: 's1', symptom: 'Headache', healthTip: 'Rest in a quiet, dark room and stay hydrated.', createdAt: Date.now() - 300000 },
  { id: 's2', symptom: 'Sore Throat', healthTip: 'Drink warm fluids with honey and gargle salt water.', createdAt: Date.now() - 200000 },
  { id: 's3', symptom: 'Fatigue', healthTip: 'Aim for 7-9 hours of sleep and eat balanced meals.', createdAt: Date.now() - 100000 },
];

function generateId(): string {
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadRecords(): SymptomRecord[] {
  if (typeof window === 'undefined') return [];

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // localStorage access failed (e.g. private browsing). Don't touch storage.
    return [];
  }

  // Genuine first visit: key was never set. Seed sample records.
  if (raw === null) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_RECORDS));
    } catch {
      // Can't write — return samples in memory only.
    }
    return [...SAMPLE_RECORDS];
  }

  // Key exists — parse it. If corrupt or not an array, return [] without
  // overwriting whatever is in storage (could be partially valid data).
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as SymptomRecord[];
  } catch {
    // Corrupt JSON — don't overwrite, start empty.
  }
  return [];
}

export default function Home() {
  const listRef = useRef<SinglyLinkedList | null>(null);
  const [records, setRecords] = useState<SymptomRecord[]>([]);
  const [count, setCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SymptomRecord[] | null>(null);
  const [symptomInput, setSymptomInput] = useState('');
  const [tipInput, setTipInput] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  const syncState = useCallback(() => {
    if (!listRef.current) return;
    setRecords(listRef.current.traverse());
    setCount(listRef.current.size());
  }, []);

  useEffect(() => {
    const loaded = loadRecords();
    const list = new SinglyLinkedList();
    list.fromArray(loaded);
    listRef.current = list;
    syncState();
    setIsLoaded(true);
  }, [syncState]);

  const persist = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!listRef.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(listRef.current.traverse()));
    } catch {
      // Quota exceeded or storage disabled — data stays in memory only.
    }
  }, []);

  const handleAdd = () => {
    const symptom = symptomInput.trim();
    const tip = tipInput.trim();
    if (!symptom || !tip) return;
    const record: SymptomRecord = {
      id: generateId(),
      symptom,
      healthTip: tip,
      createdAt: Date.now(),
    };
    listRef.current?.append(record);
    persist();
    syncState();
    setSymptomInput('');
    setTipInput('');
    // Clear search view so the new record is visible in the full list.
    setSearchResults(null);
    setSearchQuery('');
  };

  const handleDelete = (id: string) => {
    listRef.current?.deleteById(id);
    persist();
    syncState();
    if (searchResults) {
      setSearchResults((prev) => (prev ?? []).filter((r) => r.id !== id));
    }
  };

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (q === '') {
      setSearchResults(null);
      return;
    }
    const results = listRef.current?.search(q) ?? [];
    setSearchResults(results);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  const displayedRecords = searchResults ?? records;

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 shadow-sm">
            <HeartPulse className="h-6 w-6 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Medical Health Assistant</h1>
            <p className="text-sm text-slate-500">Symptom tracker with a linked-list data structure</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Add Record Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Plus className="h-5 w-5 text-teal-600" />
                Add a Symptom Record
              </CardTitle>
              <CardDescription>Enter a symptom name and a general wellness tip.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Symptom name</label>
                <Input
                  value={symptomInput}
                  onChange={(e) => setSymptomInput(e.target.value)}
                  placeholder="e.g. Nausea"
                  className="border-slate-200 focus-visible:ring-teal-600"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">General health tip</label>
                <Textarea
                  value={tipInput}
                  onChange={(e) => setTipInput(e.target.value)}
                  placeholder="e.g. Eat small, bland meals and sip ginger tea."
                  className="min-h-[80px] border-slate-200 focus-visible:ring-teal-600"
                />
              </div>
              <Button
                onClick={handleAdd}
                disabled={!symptomInput.trim() || !tipInput.trim()}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-40"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add Record
              </Button>
            </CardContent>
          </Card>

          {/* Stats + Search Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Activity className="h-5 w-5 text-teal-600" />
                Records &amp; Search
              </CardTitle>
              <CardDescription>Search and view your tracked symptoms.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-teal-50 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-600">
                  <span className="text-xl font-bold text-white">{count}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Total Records</p>
                  <p className="text-xs text-slate-500">Stored in a singly linked list</p>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Search by symptom name</label>
                <div className="flex gap-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Type a symptom name..."
                    className="border-slate-200 focus-visible:ring-teal-600"
                  />
                  <Button onClick={handleSearch} className="bg-teal-600 hover:bg-teal-700">
                    <Search className="h-4 w-4" />
                  </Button>
                  {searchResults !== null && (
                    <Button variant="outline" onClick={handleClearSearch} className="border-slate-300">
                      Clear
                    </Button>
                  )}
                </div>
                {searchResults !== null && (
                  <p className="mt-2 text-xs text-slate-500">
                    {searchResults.length} match{searchResults.length !== 1 ? 'es' : ''} found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Records List */}
        <section className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
            {searchResults !== null ? 'Search Results' : 'All Symptom Records'}
            <Badge variant="secondary" className="bg-teal-50 text-teal-700">{displayedRecords.length}</Badge>
          </h2>

          {!isLoaded ? (
            <p className="text-slate-400">Loading...</p>
          ) : displayedRecords.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-12 text-center">
              <p className="text-slate-400">
                {searchResults !== null ? 'No records match your search.' : 'No records yet. Add one above.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedRecords.map((record) => (
                <Card key={record.id} className="border-slate-200 shadow-sm transition hover:shadow-md">
                  <CardContent className="flex items-start justify-between gap-4 p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{record.symptom}</h3>
                        <Badge variant="outline" className="border-teal-200 text-teal-700 text-xs">Tip</Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{record.healthTip}</p>
                      <p className="mt-1.5 text-xs text-slate-400">
                        {new Date(record.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(record.id)}
                      className="shrink-0 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Linked List Visual Diagram */}
        <section className="mt-10">
          <h2 className="mb-1 text-lg font-bold text-slate-900">Linked List Structure</h2>
          <p className="mb-4 text-sm text-slate-500">
            Each box is a node holding a symptom record; arrows are the `next` pointer.
          </p>
          <LinkedListDiagram records={records} />
        </section>

        {/* Explanation */}
        <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Info className="h-5 w-5 text-teal-600" />
            How the Linked List Works
          </h2>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <p>
              Records are stored in a <strong>singly linked list</strong> — a chain of nodes where each
              node holds one symptom record and a pointer (`next`) to the following node. The list
              keeps a <strong>head</strong> pointer to the first node; the last node&apos;s `next` is
              <strong> null</strong>, marking the end.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg bg-white p-3">
                <p className="font-semibold text-slate-700">append — O(n)</p>
                <p className="text-xs text-slate-500">Walk to the tail, then link the new node.</p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="font-semibold text-slate-700">search — O(n)</p>
                <p className="text-xs text-slate-500">Walk every node, comparing symptom names.</p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="font-semibold text-slate-700">deleteById — O(n)</p>
                <p className="text-xs text-slate-500">Find the node, re-link the previous node&apos;s next.</p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="font-semibold text-slate-700">traverse — O(n)</p>
                <p className="text-xs text-slate-500">Visit every node once, collecting records.</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              This is general wellness information only — not a diagnosis or treatment plan.
            </p>
          </div>
        </section>

        <footer className="mt-10 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
          Medical Health Assistant — Data Structures Project
        </footer>
      </main>
    </div>
  );
}

/** Visual representation of the linked list: HEAD → [Symptom | next] → ... → NULL */
function LinkedListDiagram({ records }: { records: SymptomRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">
        HEAD → null — The list is empty.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 min-w-min">
        {/* HEAD label */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="text-xs font-bold text-teal-700">HEAD</span>
          <div className="h-0.5 w-6 bg-teal-500" />
        </div>

        {records.map((record) => (
          <div key={record.id} className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col items-center rounded-lg border-2 border-teal-600 bg-white px-3 py-2 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">{record.symptom}</span>
                <span className="text-slate-300">|</span>
                <span className="text-xs font-mono text-teal-600">next</span>
              </div>
              <span className="mt-0.5 text-[10px] text-slate-400">node</span>
            </div>
            {/* Arrow */}
            <span className="text-lg font-bold text-teal-500">→</span>
          </div>
        ))}

        {/* NULL terminator */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="rounded-md bg-slate-200 px-2 py-1 text-xs font-mono font-bold text-slate-500">NULL</span>
        </div>
      </div>
    </div>
  );
}