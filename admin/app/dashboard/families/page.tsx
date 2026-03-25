'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabaseAdmin } from '@/lib/supabase-admin';
import DataTable from '@/components/DataTable';

interface Family {
  id: string;
  name: string;
  invite_code: string;
  plan: string;
  created_at: string;
  member_count: number;
  [key: string]: unknown;
}

interface FamilyMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  last_active_at: string | null;
}

interface FamilyCheckinStats {
  totalCheckins: number;
  last7Days: number;
  avgMood: string;
}

export default function FamiliesPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [checkinStats, setCheckinStats] = useState<FamilyCheckinStats | null>(null);
  const [editingPlan, setEditingPlan] = useState(false);
  const [newPlan, setNewPlan] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);

  const loadFamilies = useCallback(async () => {
    try {
      const { data: familiesData, error: fetchErr } = await supabaseAdmin
        .from('families')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;

      if (familiesData) {
        // Get member counts for all families in parallel
        const withCounts = await Promise.all(
          familiesData.map(async (f) => {
            const { count } = await supabaseAdmin
              .from('users')
              .select('id', { count: 'exact', head: true })
              .eq('family_id', f.id);
            return { ...f, member_count: count ?? 0 } as Family;
          })
        );
        setFamilies(withCounts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load families');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFamilies();
  }, [loadFamilies]);

  const loadFamilyDetails = async (familyId: string) => {
    // Load members
    const { data: membersData } = await supabaseAdmin
      .from('users')
      .select('id, name, role, phone, last_active_at')
      .eq('family_id', familyId);
    setMembers((membersData ?? []) as FamilyMember[]);

    // Load check-in stats for the family
    const memberIds = (membersData ?? []).map((m: { id: string }) => m.id);
    if (memberIds.length > 0) {
      const [totalRes, recentRes, moodRes] = await Promise.all([
        supabaseAdmin
          .from('checkins')
          .select('id', { count: 'exact', head: true })
          .in('user_id', memberIds),
        supabaseAdmin
          .from('checkins')
          .select('id', { count: 'exact', head: true })
          .in('user_id', memberIds)
          .gte('checked_in_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabaseAdmin
          .from('checkins')
          .select('mood')
          .in('user_id', memberIds)
          .order('checked_in_at', { ascending: false })
          .limit(50),
      ]);

      // Compute average mood from recent
      const moods = (moodRes.data ?? []) as { mood: string }[];
      const moodScores: Record<string, number> = { great: 3, ok: 2, not_great: 1 };
      const avgScore =
        moods.length > 0
          ? moods.reduce((sum, m) => sum + (moodScores[m.mood] ?? 2), 0) / moods.length
          : 0;
      const avgMood = avgScore >= 2.5 ? 'great' : avgScore >= 1.5 ? 'ok' : moods.length > 0 ? 'not_great' : 'N/A';

      setCheckinStats({
        totalCheckins: totalRes.count ?? 0,
        last7Days: recentRes.count ?? 0,
        avgMood,
      });
    } else {
      setCheckinStats({ totalCheckins: 0, last7Days: 0, avgMood: 'N/A' });
    }
  };

  const handleUpdatePlan = async (familyId: string) => {
    setSavingPlan(true);
    try {
      const { error: updateErr } = await supabaseAdmin
        .from('families')
        .update({ plan: newPlan })
        .eq('id', familyId);
      if (updateErr) throw updateErr;
      setEditingPlan(false);
      if (selectedFamily) {
        setSelectedFamily({ ...selectedFamily, plan: newPlan });
      }
      await loadFamilies();
    } catch (err) {
      alert('Update failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeleteFamily = async (familyId: string) => {
    setDeleting(true);
    try {
      // Delete users' checkins, then users, then messages, then the family
      const { data: familyUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('family_id', familyId);
      if (familyUsers) {
        for (const u of familyUsers) {
          await supabaseAdmin.from('checkins').delete().eq('user_id', u.id);
        }
        await supabaseAdmin.from('users').delete().eq('family_id', familyId);
      }
      await supabaseAdmin.from('messages').delete().eq('family_id', familyId);
      await supabaseAdmin.from('families').delete().eq('id', familyId);
      setShowDeleteConfirm(null);
      setSelectedFamily(null);
      await loadFamilies();
    } catch (err) {
      alert('Delete failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  };

  const planColors: Record<string, string> = {
    free: 'bg-gray-700 text-gray-300',
    family: 'bg-blue-900/50 text-blue-400',
    smart: 'bg-purple-900/50 text-purple-400',
    premium: 'bg-amber-900/50 text-amber-400',
  };

  const moodEmoji: Record<string, string> = { great: '😊', ok: '😐', not_great: '😟', 'N/A': '—' };

  const columns = [
    { key: 'name', label: 'Name' },
    {
      key: 'invite_code',
      label: 'Invite Code',
      render: (row: Family) => (
        <code className="text-xs bg-gray-800 px-2 py-0.5 rounded font-mono">{row.invite_code}</code>
      ),
    },
    {
      key: 'plan',
      label: 'Plan',
      render: (row: Family) => (
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${planColors[row.plan] ?? planColors.free}`}
        >
          {row.plan}
        </span>
      ),
    },
    { key: 'member_count', label: 'Members' },
    {
      key: 'created_at',
      label: 'Created',
      render: (row: Family) => new Date(row.created_at).toLocaleDateString(),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-indigo-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading families...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-800 rounded-xl p-6">
        <h3 className="text-red-400 font-medium">Error loading families</h3>
        <p className="text-red-400/70 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Family Management</h2>
        <p className="text-gray-400 text-sm mt-1">{families.length} total families</p>
      </div>

      <DataTable
        columns={columns}
        data={families}
        searchKeys={['name', 'invite_code', 'plan']}
        onRowClick={(family) => {
          setSelectedFamily(family);
          setEditingPlan(false);
          setNewPlan(family.plan);
          setShowDeleteConfirm(null);
          loadFamilyDetails(family.id);
        }}
      />

      {/* Family Detail Modal */}
      {selectedFamily && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedFamily.name}</h3>
                <p className="text-sm text-gray-400">
                  {selectedFamily.member_count} members &middot; Code:{' '}
                  <code className="font-mono">{selectedFamily.invite_code}</code>
                </p>
              </div>
              <button
                onClick={() => setSelectedFamily(null)}
                className="text-gray-400 hover:text-white text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Plan editing */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">Plan:</span>
                {editingPlan ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={newPlan}
                      onChange={(e) => setNewPlan(e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm text-white"
                    >
                      <option value="free">Free</option>
                      <option value="family">Family</option>
                      <option value="smart">Smart</option>
                      <option value="premium">Premium</option>
                    </select>
                    <button
                      onClick={() => handleUpdatePlan(selectedFamily.id)}
                      disabled={savingPlan}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm rounded"
                    >
                      {savingPlan ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingPlan(false)}
                      className="px-3 py-1 bg-gray-700 text-white text-sm rounded"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${planColors[selectedFamily.plan] ?? planColors.free}`}
                    >
                      {selectedFamily.plan}
                    </span>
                    <button
                      onClick={() => {
                        setEditingPlan(true);
                        setNewPlan(selectedFamily.plan);
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Check-in stats */}
              {checkinStats && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-white">{checkinStats.totalCheckins}</div>
                    <div className="text-xs text-gray-400">Total Check-ins</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-white">{checkinStats.last7Days}</div>
                    <div className="text-xs text-gray-400">Last 7 Days</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-white">
                      {moodEmoji[checkinStats.avgMood] ?? '—'}
                    </div>
                    <div className="text-xs text-gray-400">Avg Mood</div>
                  </div>
                </div>
              )}

              {/* Members */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Members</h4>
                {members.length === 0 ? (
                  <p className="text-gray-600 text-sm">No members</p>
                ) : (
                  <div className="space-y-2">
                    {members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between py-2 px-3 bg-gray-800 rounded-lg text-sm"
                      >
                        <div>
                          <span className="text-white">{m.name}</span>
                          <span className="text-gray-500 ml-2">{m.phone}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {m.last_active_at && (
                            <span className="text-xs text-gray-500">
                              {new Date(m.last_active_at).toLocaleDateString()}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              m.role === 'parent'
                                ? 'bg-blue-900/50 text-blue-400'
                                : 'bg-purple-900/50 text-purple-400'
                            }`}
                          >
                            {m.role}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delete */}
              <div className="pt-4 border-t border-gray-800 flex justify-end">
                {showDeleteConfirm === selectedFamily.id ? (
                  <div className="flex items-center gap-3">
                    <span className="text-red-400 text-sm">Delete family and all member data?</span>
                    <button
                      onClick={() => handleDeleteFamily(selectedFamily.id)}
                      disabled={deleting}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm rounded-lg"
                    >
                      {deleting ? 'Deleting...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(selectedFamily.id)}
                    className="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-400 text-sm rounded-lg"
                  >
                    Delete Family
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
