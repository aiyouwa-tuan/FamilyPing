'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabaseAdmin } from '@/lib/supabase-admin';
import DataTable from '@/components/DataTable';

interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  family_id: string;
  created_at: string;
  last_active_at: string | null;
  families: { name: string } | null;
  [key: string]: unknown;
}

interface Checkin {
  id: string;
  mood: string;
  checked_in_at: string;
  question_answer: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userCheckins, setUserCheckins] = useState<Checkin[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    const { data } = await supabaseAdmin
      .from('users')
      .select('*, families(name)')
      .order('created_at', { ascending: false });
    setUsers((data as unknown as User[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const loadUserCheckins = async (userId: string) => {
    const { data } = await supabaseAdmin
      .from('checkins')
      .select('id, mood, checked_in_at, question_answer')
      .eq('user_id', userId)
      .order('checked_in_at', { ascending: false })
      .limit(20);
    setUserCheckins((data ?? []) as Checkin[]);
  };

  const handleDeleteUser = async (userId: string) => {
    await supabaseAdmin.from('checkins').delete().eq('user_id', userId);
    await supabaseAdmin.from('users').delete().eq('id', userId);
    setShowDeleteConfirm(null);
    setSelectedUser(null);
    loadUsers();
  };

  const moodEmoji: Record<string, string> = { great: '😊', ok: '😐', not_great: '😟' };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'role',
      label: 'Role',
      render: (row: User) => (
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            row.role === 'parent'
              ? 'bg-blue-900/50 text-blue-400'
              : 'bg-purple-900/50 text-purple-400'
          }`}
        >
          {row.role}
        </span>
      ),
    },
    {
      key: 'family_name',
      label: 'Family',
      render: (row: User) => row.families?.name ?? '-',
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (row: User) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      key: 'last_active_at',
      label: 'Last Active',
      render: (row: User) =>
        row.last_active_at ? new Date(row.last_active_at).toLocaleString() : 'Never',
    },
  ];

  if (loading) return <div className="text-gray-500">Loading users...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        <p className="text-gray-400 text-sm mt-1">{users.length} total users</p>
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchKeys={['name', 'phone', 'role']}
        onRowClick={(user) => {
          setSelectedUser(user);
          loadUserCheckins(user.id);
        }}
      />

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedUser.name}</h3>
                <p className="text-sm text-gray-400">
                  {selectedUser.role} &middot; {selectedUser.phone}
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-white text-xl"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Family:</span>{' '}
                  <span className="text-white">{selectedUser.families?.name ?? '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>{' '}
                  <span className="text-white">
                    {new Date(selectedUser.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">ID:</span>{' '}
                  <span className="text-white font-mono text-xs">{selectedUser.id}</span>
                </div>
                <div>
                  <span className="text-gray-500">Last Active:</span>{' '}
                  <span className="text-white">
                    {selectedUser.last_active_at
                      ? new Date(selectedUser.last_active_at).toLocaleString()
                      : 'Never'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">
                  Recent Check-ins ({userCheckins.length})
                </h4>
                {userCheckins.length === 0 ? (
                  <p className="text-gray-600 text-sm">No check-ins</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-auto">
                    {userCheckins.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between py-2 px-3 bg-gray-800 rounded-lg text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span>{moodEmoji[c.mood] ?? '?'}</span>
                          <span className="text-gray-300 capitalize">{c.mood.replace('_', ' ')}</span>
                        </div>
                        <div className="text-gray-500 text-xs">
                          {new Date(c.checked_in_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-800 flex justify-end">
                {showDeleteConfirm === selectedUser.id ? (
                  <div className="flex items-center gap-3">
                    <span className="text-red-400 text-sm">Are you sure?</span>
                    <button
                      onClick={() => handleDeleteUser(selectedUser.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg"
                    >
                      Confirm Delete
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
                    onClick={() => setShowDeleteConfirm(selectedUser.id)}
                    className="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-400 text-sm rounded-lg"
                  >
                    Delete User
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
