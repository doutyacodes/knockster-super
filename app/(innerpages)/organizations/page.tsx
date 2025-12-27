"use client"

import React, { useState, useEffect } from 'react';
import {
  Network,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Building2,
  MapPin,
  ShieldCheck,
  User,
  Layers,
  Loader2,
  AlertCircle,
  CheckCircle,
  Pencil,
  Trash2,
  CreditCard,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { api } from '@/lib/api-client';

interface OrgNode {
  id: string;
  name: string;
  type: string;
  parentId?: string | null;
  status: string;
  children?: OrgNode[];
}

interface OrgPlan {
  id: string;
  organizationNodeId: string;
  subscriptionPlanId: string;
  startDate: string;
  endDate: string | null;
  status: string;
  createdAt: string;
  planName: string;
  planPrice: string;
  allowL1: boolean;
  allowL2: boolean;
  allowL3: boolean;
  allowL4: boolean;
  maxGuards: number;
  maxGuestPasses: number;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  allowL1: boolean;
  allowL2: boolean;
  allowL3: boolean;
  allowL4: boolean;
  maxGuards: number;
  maxGuestPasses: number;
}

interface TreeItemProps {
  node: OrgNode;
  level: number;
  onSelect: (node: OrgNode) => void;
  selectedId: string;
}

const TreeItem: React.FC<TreeItemProps> = ({
  node,
  level,
  onSelect,
  selectedId,
}) => {
  const [isOpen, setIsOpen] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  return (
    <div className="select-none">
      <div
        className={`
          flex items-center py-2 px-3 rounded-lg cursor-pointer transition-all group
          ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'}
        `}
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
        onClick={() => {
          onSelect(node);
          if (hasChildren) setIsOpen(!isOpen);
        }}
      >
        <span className="w-5 h-5 flex items-center justify-center mr-1">
          {hasChildren ? (
            isOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          ) : (
            <div className="w-1 h-1 rounded-full bg-slate-300 ml-1.5" />
          )}
        </span>
        <Building2
          className={`w-4 h-4 mr-2 ${
            isSelected ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-500'
          }`}
        />
        <span className="text-sm font-medium">{node.name}</span>
        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-slate-300 group-hover:text-slate-400">
          {node.type}
        </span>
      </div>

      {hasChildren && isOpen && (
        <div className="mt-0.5">
          {node.children!.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Organizations: React.FC = () => {
  const [nodes, setNodes] = useState<OrgNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Plan management
  const [orgPlans, setOrgPlans] = useState<OrgPlan[]>([]);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [isAssignPlanModalOpen, setIsAssignPlanModalOpen] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: '',
    type: 'company',
    parentId: '',
  });

  const [assignPlanForm, setAssignPlanForm] = useState({
    subscriptionPlanId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  useEffect(() => {
    fetchOrganizations();
    fetchAvailablePlans();
  }, []);

  useEffect(() => {
    if (selectedNode) {
      fetchOrgPlans(selectedNode.id);
    }
  }, [selectedNode]);

  const fetchAvailablePlans = async () => {
    try {
      const data = await api.get<Plan[]>('/api/superadmin/plans');
      setAvailablePlans(data);
    } catch (err: any) {
      console.error('Failed to fetch plans:', err);
    }
  };

  const fetchOrgPlans = async (orgId: string) => {
    try {
      setLoadingPlans(true);
      const data = await api.get<OrgPlan[]>(`/api/superadmin/organizations/${orgId}/plans`);
      setOrgPlans(data);
    } catch (err: any) {
      console.error('Failed to fetch organization plans:', err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const data = await api.get<OrgNode[]>('/api/superadmin/organizations?includeChildren=true');
      const tree = buildTree(data);
      setNodes(tree);
      if (tree.length > 0 && !selectedNode) {
        setSelectedNode(tree[0]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (flatList: OrgNode[]): OrgNode[] => {
    const map = new Map<string, OrgNode>();
    const roots: OrgNode[] = [];

    flatList.forEach(node => {
      map.set(node.id, { ...node, children: [] });
    });

    flatList.forEach(node => {
      const current = map.get(node.id)!;
      if (node.parentId) {
        const parent = map.get(node.parentId);
        if (parent) {
          parent.children!.push(current);
        } else {
          roots.push(current);
        }
      } else {
        roots.push(current);
      }
    });

    return roots;
  };

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.post('/api/superadmin/organizations', {
        ...createForm,
        parentId: createForm.parentId || null,
      });
      setSuccess('Organization node created successfully!');
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', type: 'company', parentId: '' });
      fetchOrganizations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm('Are you sure you want to delete this node? This will also delete all child nodes.')) {
      return;
    }

    try {
      await api.delete(`/api/superadmin/organizations/${nodeId}`);
      setSuccess('Organization deleted successfully!');
      fetchOrganizations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAssignPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode) return;

    setSubmitting(true);
    setError('');

    try {
      // Convert dates to ISO datetime format
      const startDateTime = new Date(assignPlanForm.startDate).toISOString();
      const endDateTime = assignPlanForm.endDate ? new Date(assignPlanForm.endDate).toISOString() : null;

      await api.post(`/api/superadmin/organizations/${selectedNode.id}/plans`, {
        subscriptionPlanId: assignPlanForm.subscriptionPlanId,
        startDate: startDateTime,
        endDate: endDateTime,
      });
      setSuccess('Plan assigned successfully!');
      setIsAssignPlanModalOpen(false);
      setAssignPlanForm({
        subscriptionPlanId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
      });
      fetchOrgPlans(selectedNode.id);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemovePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to remove this plan assignment?')) {
      return;
    }

    if (!selectedNode) return;

    try {
      await api.delete(`/api/superadmin/organizations/${selectedNode.id}/plans/${planId}`);
      setSuccess('Plan removed successfully!');
      fetchOrgPlans(selectedNode.id);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getAllNodes = (nodes: OrgNode[]): OrgNode[] => {
    let result: OrgNode[] = [];
    nodes.forEach(node => {
      result.push(node);
      if (node.children && node.children.length > 0) {
        result = result.concat(getAllNodes(node.children));
      }
    });
    return result;
  };

  const allFlatNodes = getAllNodes(nodes);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      {success && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
          <CheckCircle className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Organizations</h1>
          <p className="text-slate-500">Global hierarchy management and asset tracking.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-200"
        >
          <Plus className="w-5 h-5" />
          <span>Add Node</span>
        </button>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden">
        {/* Left Side: Tree Explorer */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {nodes.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No organizations yet. Create one to get started.
              </div>
            ) : (
              nodes.map(node => (
                <TreeItem
                  key={node.id}
                  node={node}
                  level={0}
                  onSelect={setSelectedNode}
                  selectedId={selectedNode?.id || ''}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Side: Details Pane */}
        {selectedNode && (
          <div className="lg:col-span-8 space-y-6 overflow-y-auto pr-2 pb-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600 px-8 flex items-end">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center translate-y-6">
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="pt-10 pb-8 px-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">{selectedNode.name}</h2>
                    <p className="text-slate-500 flex items-center mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      Organizational Node • {selectedNode.type}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDeleteNode(selectedNode.id)}
                      className="px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-all"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        setCreateForm({ ...createForm, parentId: selectedNode.id });
                        setIsCreateModalOpen(true);
                      }}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all"
                    >
                      Add Sub-Node
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 pt-8 border-t border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center text-slate-400 mb-1">
                      <User className="w-4 h-4 mr-2" />
                      <span className="text-xs font-bold uppercase tracking-wider">Status</span>
                    </div>
                    <p className="text-slate-800 font-semibold">{selectedNode.status}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center text-slate-400 mb-1">
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      <span className="text-xs font-bold uppercase tracking-wider">Node Type</span>
                    </div>
                    <p className="text-slate-800 font-semibold uppercase">{selectedNode.type}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center text-slate-400 mb-1">
                      <Layers className="w-4 h-4 mr-2" />
                      <span className="text-xs font-bold uppercase tracking-wider">Direct Children</span>
                    </div>
                    <p className="text-slate-800 font-semibold">{selectedNode.children?.length || 0} Units</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Plans Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Subscription Plans</h3>
                  <p className="text-sm text-slate-500">Active plan assignments for this organization</p>
                </div>
                <button
                  onClick={() => setIsAssignPlanModalOpen(true)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-200"
                >
                  <Plus className="w-4 h-4" />
                  <span>Assign Plan</span>
                </button>
              </div>

              <div className="p-6">
                {loadingPlans ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  </div>
                ) : orgPlans.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No plans assigned yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orgPlans.map((plan) => {
                      const securityLevels = [
                        plan.allowL1 && 'L1',
                        plan.allowL2 && 'L2',
                        plan.allowL3 && 'L3',
                        plan.allowL4 && 'L4',
                      ].filter(Boolean);

                      return (
                        <div
                          key={plan.id}
                          className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-bold text-slate-800">{plan.planName}</h4>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    plan.status === 'active'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : plan.status === 'expired'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {plan.status}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                <div>
                                  <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    Price
                                  </div>
                                  <p className="text-sm font-semibold text-slate-700">${plan.planPrice}/mo</p>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" />
                                    Security
                                  </div>
                                  <p className="text-sm font-semibold text-slate-700">{securityLevels.join(', ')}</p>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    Guards
                                  </div>
                                  <p className="text-sm font-semibold text-slate-700">{plan.maxGuards}</p>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Passes
                                  </div>
                                  <p className="text-sm font-semibold text-slate-700">{plan.maxGuestPasses}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                                <span>Start: {new Date(plan.startDate).toLocaleDateString()}</span>
                                {plan.endDate && (
                                  <>
                                    <span>•</span>
                                    <span>End: {new Date(plan.endDate).toLocaleDateString()}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => handleRemovePlan(plan.id)}
                              className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Remove plan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Create Organization Node</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form className="p-6 space-y-4" onSubmit={handleCreateNode}>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Node Name</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g., Silicon Valley Tech Park"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Node Type</label>
                <select
                  required
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="techpark">Tech Park</option>
                  <option value="block">Block</option>
                  <option value="building">Building</option>
                  <option value="company">Company</option>
                  <option value="gate">Gate</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Parent Node (Optional)</label>
                <select
                  value={createForm.parentId}
                  onChange={(e) => setCreateForm({ ...createForm, parentId: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">None (Root Node)</option>
                  {allFlatNodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.name} ({node.type})
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Node'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Plan Modal */}
      {isAssignPlanModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Assign Subscription Plan</h3>
              <button onClick={() => setIsAssignPlanModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form className="p-6 space-y-4" onSubmit={handleAssignPlan}>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Subscription Plan</label>
                <select
                  required
                  value={assignPlanForm.subscriptionPlanId}
                  onChange={(e) => setAssignPlanForm({ ...assignPlanForm, subscriptionPlanId: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select a plan</option>
                  {availablePlans.map((plan) => {
                    const securityLevels = [
                      plan.allowL1 && 'L1',
                      plan.allowL2 && 'L2',
                      plan.allowL3 && 'L3',
                      plan.allowL4 && 'L4',
                    ].filter(Boolean).join(', ');

                    return (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - ${plan.price}/mo ({securityLevels})
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={assignPlanForm.startDate}
                  onChange={(e) => setAssignPlanForm({ ...assignPlanForm, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">End Date (Optional)</label>
                <input
                  type="date"
                  value={assignPlanForm.endDate}
                  onChange={(e) => setAssignPlanForm({ ...assignPlanForm, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-xs text-slate-400 mt-1">Leave empty for ongoing subscription</p>
              </div>
              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAssignPlanModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    'Assign Plan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Organizations;
