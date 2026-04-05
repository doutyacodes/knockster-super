"use client"

import React, { useState, useEffect } from 'react';
import {
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
  maxSubNodes: number;
  children?: OrgNode[];
  createdAt: string;
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
  duration: string;
}

interface SubNodeAdmin {
  id: string;
  email: string;
  status: string;
  createdAt: string;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignPlanModalOpen, setIsAssignPlanModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Forms state
  const [editForm, setEditForm] = useState({ id: '', name: '', type: '', maxSubNodes: 0 });
  const [createForm, setCreateForm] = useState({ name: '', type: 'company', parentId: '', maxSubNodes: 0 });
  const [assignPlanForm, setAssignPlanForm] = useState({ subscriptionPlanId: '', startDate: new Date().toISOString().split('T')[0], endDate: '' });
  const [adminForm, setAdminForm] = useState({ email: "", password: "" });

  // Plan/Admin data state
  const [orgPlans, setOrgPlans] = useState<OrgPlan[]>([]);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [nodeAdmins, setNodeAdmins] = useState<SubNodeAdmin[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedNode) {
      fetchOrgPlans(selectedNode.id);
    }
  }, [selectedNode]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchOrganizations(), fetchAvailablePlans()]);
    setLoading(false);
  };

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
      const data = await api.get<OrgNode[]>('/api/superadmin/organizations?includeChildren=true');
      const tree = buildTree(data);
      setNodes(tree);
      if (tree.length > 0 && !selectedNode) {
        setSelectedNode(tree[0]);
      }
    } catch (err: any) {
      setError(err.message);
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
        maxSubNodes: Number(createForm.maxSubNodes),
      });
      setSuccess('Organization node created successfully!');
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', type: 'company', parentId: '', maxSubNodes: 0 });
      fetchOrganizations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.patch(`/api/superadmin/organizations/${editForm.id}`, {
        name: editForm.name,
        type: editForm.type,
        maxSubNodes: Number(editForm.maxSubNodes),
      });
      setSuccess('Organization updated successfully!');
      setIsEditModalOpen(false);
      fetchOrganizations();
      if (selectedNode?.id === editForm.id) {
        setSelectedNode(prev => prev ? { ...prev, name: editForm.name, type: editForm.type, maxSubNodes: Number(editForm.maxSubNodes) } : null);
      }
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

  const fetchNodeAdmins = async (nodeId: string) => {
    try {
      const admins = await api.get<SubNodeAdmin[]>(`/api/organizations/sub-node-admins?organizationNodeId=${nodeId}`);
      setNodeAdmins(admins);
    } catch (err: any) {
      setError(err.message || "Failed to fetch node admins");
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode) return;

    setSubmitting(true);
    setError("");

    try {
      await api.post("/api/organizations/sub-node-admins", {
        ...adminForm,
        organizationNodeId: selectedNode.id,
      });
      setSuccess("Admin created successfully!");
      setAdminForm({ email: "", password: "" });
      fetchNodeAdmins(selectedNode.id);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to create admin");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode) return;

    setSubmitting(true);
    setError('');

    try {
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

  const getAllNodes = (nodesList: OrgNode[]): OrgNode[] => {
    let result: OrgNode[] = [];
    nodesList.forEach(node => {
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
      {/* Alert Notifications */}
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
          onClick={() => {
            setCreateForm({ ...createForm, parentId: '', maxSubNodes: 0 });
            setIsCreateModalOpen(true);
          }}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-200"
        >
          <Plus className="w-5 h-5" />
          <span>Add Root Node</span>
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
        {selectedNode ? (
          <div className="lg:col-span-8 space-y-6 overflow-y-auto pr-2 pb-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600 px-8 flex items-end">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center translate-y-6 text-2xl">
                  {selectedNode.type === 'company' ? '🏢' : selectedNode.type === 'school' ? '🏫' : '🏗️'}
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
                      onClick={() => {
                        setSelectedNode(selectedNode);
                        setIsAdminModalOpen(true);
                        fetchNodeAdmins(selectedNode.id);
                      }}
                      className="px-4 py-2 border border-blue-200 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-all"
                    >
                      Manage Admins
                    </button>
                    <button
                      onClick={() => {
                        setEditForm({
                          id: selectedNode.id,
                          name: selectedNode.name,
                          type: selectedNode.type,
                          maxSubNodes: selectedNode.maxSubNodes,
                        });
                        setIsEditModalOpen(true);
                      }}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all"
                    >
                      Edit Node
                    </button>
                    <button
                      onClick={() => {
                        setCreateForm({ ...createForm, parentId: selectedNode.id, maxSubNodes: 0 });
                        setIsCreateModalOpen(true);
                      }}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg"
                    >
                      Add Sub-Node
                    </button>
                    <button
                      onClick={() => handleDeleteNode(selectedNode.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
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
                      <span className="text-xs font-bold uppercase tracking-wider">Quota</span>
                    </div>
                    <p className="text-slate-800 font-semibold">{selectedNode.children?.length || 0} / {selectedNode.maxSubNodes} Sub-Nodes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Plans Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Subscription Plans</h3>
                  <p className="text-sm text-slate-500">Active plan assignments</p>
                </div>
                <button
                  onClick={() => setIsAssignPlanModalOpen(true)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg"
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
                    {orgPlans.map((plan) => (
                      <div key={plan.id} className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-bold text-slate-800">{plan.planName}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${plan.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                              {plan.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1 text-xs text-slate-500">
                             <div className="flex items-center gap-1"><DollarSign className="w-3 h-3"/> ${plan.planPrice}/mo</div>
                             <div className="flex items-center gap-1"><User className="w-3 h-3"/> {plan.maxGuards} Guards</div>
                             <div className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {plan.maxGuestPasses} Passes</div>
                             <div className="flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> {[plan.allowL1&&'L1',plan.allowL2&&'L2',plan.allowL3&&'L3',plan.allowL4&&'L4'].filter(Boolean).join(', ')}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right whitespace-nowrap">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Expires</p>
                            <p className="text-xs font-semibold text-slate-700">{plan.endDate ? new Date(plan.endDate).toLocaleDateString() : 'Never'}</p>
                          </div>
                          <button onClick={() => handleRemovePlan(plan.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 flex flex-col items-center justify-center text-slate-400 p-12 bg-white rounded-2xl border border-slate-100 border-dashed">
            <Building2 className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium text-slate-300">Select an organization to view details</p>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between">
               <h3 className="text-xl font-bold text-slate-800">Assign Sub-Node</h3>
               <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Plus className="w-6 h-6 rotate-45"/></button>
             </div>
             <form className="p-6 space-y-4" onSubmit={handleCreateNode}>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Parent Node</label>
                  <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-600">
                    {selectedNode?.name || 'Root Organization'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Node Name</label>
                  <input type="text" required value={createForm.name} onChange={(e)=>setCreateForm({...createForm, name: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Node Type</label>
                  <select required value={createForm.type} onChange={(e)=>setCreateForm({...createForm, type: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="techpark">Tech Park</option>
                    <option value="school">School</option>
                    <option value="block">Block</option>
                    <option value="building">Building</option>
                    <option value="classroom">Classroom</option>
                    <option value="lab">Lab</option>
                    <option value="company">Company</option>
                    <option value="gate">Gate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Max Sub-Nodes Quota</label>
                  <input type="number" required min="0" value={createForm.maxSubNodes} onChange={(e)=>setCreateForm({...createForm, maxSubNodes: parseInt(e.target.value)||0})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div className="pt-4 flex space-x-3">
                  <button type="button" onClick={()=>setIsCreateModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 disabled:opacity-50">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : 'Create Node'}
                  </button>
                </div>
             </form>
           </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between">
               <h3 className="text-xl font-bold text-slate-800">Edit Node</h3>
               <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Plus className="w-6 h-6 rotate-45"/></button>
             </div>
             <form className="p-6 space-y-4" onSubmit={handleUpdateNode}>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Node Name</label>
                  <input type="text" required value={editForm.name} onChange={(e)=>setEditForm({...editForm, name: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                </div>
                <div>
                   <label className="block text-sm font-semibold text-slate-700 mb-1">Max Sub-Nodes Quota</label>
                   <input type="number" required min="0" value={editForm.maxSubNodes} onChange={(e)=>setEditForm({...editForm, maxSubNodes: parseInt(e.target.value)||0})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div className="pt-4 flex space-x-3">
                  <button type="button" onClick={()=>setIsEditModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 disabled:opacity-50">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : 'Save Changes'}
                  </button>
                </div>
             </form>
           </div>
        </div>
      )}

      {/* Admin Modal */}
      {isAdminModalOpen && selectedNode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Manage Admins</h3>
                <p className="text-xs text-slate-500">For {selectedNode.name}</p>
              </div>
              <button onClick={() => setIsAdminModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Plus className="w-6 h-6 rotate-45"/></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-sm font-bold text-slate-800 mb-3">Add New Admin</h4>
                <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleCreateAdmin}>
                  <input type="email" required value={adminForm.email} onChange={(e)=>setAdminForm({...adminForm, email: e.target.value})} className="px-4 py-2 border border-slate-200 rounded-lg text-sm" placeholder="email@example.com"/>
                  <input type="password" required value={adminForm.password} onChange={(e)=>setAdminForm({...adminForm, password: e.target.value})} className="px-4 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Password"/>
                  <button type="submit" disabled={submitting} className="sm:col-span-2 py-2 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Provision Admin"}
                  </button>
                </form>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3">Active Admins</h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-bold text-slate-500 uppercase">
                      <tr><th className="px-4 py-3">Email</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {nodeAdmins.map(admin => (
                        <tr key={admin.id}>
                          <td className="px-4 py-3 font-semibold text-slate-700">{admin.email}</td>
                          <td className="px-4 py-3 text-emerald-600 font-bold uppercase">{admin.status}</td>
                          <td className="px-4 py-3 text-slate-400">{new Date(admin.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {nodeAdmins.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">No admins provisioned for this unit.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Plan Modal */}
      {isAssignPlanModalOpen && selectedNode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Assign Subscription</h3>
              <button onClick={() => setIsAssignPlanModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Plus className="w-6 h-6 rotate-45"/></button>
            </div>
            <form className="p-6 space-y-4" onSubmit={handleAssignPlan}>
              <select required value={assignPlanForm.subscriptionPlanId} onChange={(e)=>setAssignPlanForm({...assignPlanForm, subscriptionPlanId: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm">
                <option value="">Select a plan</option>
                {availablePlans.map(plan => <option key={plan.id} value={plan.id}>{plan.name} (${plan.price}/{plan.duration})</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" required value={assignPlanForm.startDate} onChange={(e)=>setAssignPlanForm({...assignPlanForm, startDate: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm" />
                <input type="date" value={assignPlanForm.endDate} onChange={(e)=>setAssignPlanForm({...assignPlanForm, endDate: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={()=>setIsAssignPlanModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : 'Confirm Selection'}
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
