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

export default function FamiliesPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [editingPlan, setEditingPlan] = useState(false);
  const [newPlan, setNewPlan] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const loadFamilies = useCallback(async () => {
    const { data: familiesData } = await supabaseAdmin
      .from('families')
      .select('*')
      .order('created_at', { ascending: false });

    if (familiesData) {
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
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFamilies();
  }, [loadFamilies]);

  const loadMembers = async (familyId: string) => {
    const { data } = await supabaseAdmin
      .from('users')
      .select('id, name, role, phone, last_active_at')
      .eq('family_id', familyId);
    setMembers((data ?? []) as FamilyMember[]);
  };

  const handleUpdatePlan = async (familyId: string) => {
    await supabaseAdmin.from('families').update({ plan: newPlan }).eq('id', familyId);
    setEditingPlan(false);
    loadFamilies();
    if (selectedFamily) {
      setSelectedFamily({ ...selectedFamily, plan: newPlan });
    }
  };

  const handleDeleteFamily = async (familyId: string) => {
    // Delete users and their checkins first
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
    loadFamilies();
  };

  const planColors: Record<string, string> = {
    free: 'bg-gray-700 text-gray-300',
    family: 'bg-blue-900/50 text-blue-400',
    smart: 'bg-purple-900/50 text-purple-400',
    premium: 'bg-amber-900/50 text-amber-400',
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'invite_code', label: 'Invite Code', render: (row: Family) => <code className="text-xs bg-gray-800 px-2 py-0.5 rounded">{row.invite_code}</code> },
    {
      key: 'plan',
      label: 'Plan',
      render: (row: Family) => (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${planColors[row.plan] ?? planColors.free}`}>
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

  if (loading) return <div className="text-gray-500">Loading families...</div>;

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
          loadMembers(family.id);
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
                  {selectedFamily.member_count} members &middot; Code: {selectedFamily.invite_code}
                </p>
              </div>
              <button
                onClick={() => setSelectedFamily(null)}
                className="text-gray-400 hover:text-white text-xl"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
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
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded"
                    >
                      Save
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
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${planColors[selectedFamily.plan]}`}>
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
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-800 flex justify-end">
                {showDeleteConfirm === selectedFamily.id ? (
                  <div className="flex items-center gap-3">
                    <span className="text-red-400 text-sm">Delete family and all data?</span>
                    <button
                      onClick={() => handleDeleteFamily(selectedFamily.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg"
                    >
                      Confirm
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
