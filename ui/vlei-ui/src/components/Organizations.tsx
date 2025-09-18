import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeriStore } from '../store/keriStore';

interface Organization {
  id: string;
  name: string;
  description: string;
  adminAids: string[];
  memberAids: string[];
  credentials: string[]; // Credential SAIDs
  createdAt: string;
}

export const Organizations: React.FC = () => {
  const navigate = useNavigate();
  const { aids, credentials, isConnected } = useKeriStore();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  
  // New org form data
  const [newOrgData, setNewOrgData] = useState({
    name: '',
    description: '',
    adminAid: ''
  });

  // Member management
  const [newMemberAid, setNewMemberAid] = useState('');
  const [selectedCredentials, setSelectedCredentials] = useState<string[]>([]);

  useEffect(() => {
    if (!isConnected) {
      navigate('/');
    }
  }, [isConnected, navigate]);

  useEffect(() => {
    // Load organizations from localStorage (in a real app, this would be from a backend)
    const stored = localStorage.getItem('organizations');
    if (stored) {
      setOrganizations(JSON.parse(stored));
    }
  }, []);

  const saveOrganizations = (orgs: Organization[]) => {
    localStorage.setItem('organizations', JSON.stringify(orgs));
    setOrganizations(orgs);
  };

  const handleCreateOrg = () => {
    if (!newOrgData.name || !newOrgData.adminAid) return;

    const newOrg: Organization = {
      id: Date.now().toString(),
      name: newOrgData.name,
      description: newOrgData.description,
      adminAids: [newOrgData.adminAid],
      memberAids: [],
      credentials: [],
      createdAt: new Date().toISOString()
    };

    const updated = [...organizations, newOrg];
    saveOrganizations(updated);
    
    setNewOrgData({ name: '', description: '', adminAid: '' });
    setShowCreateModal(false);
  };

  const handleAddMember = () => {
    if (!selectedOrg || !newMemberAid) return;

    const updated = organizations.map(org => {
      if (org.id === selectedOrg.id) {
        return {
          ...org,
          memberAids: [...org.memberAids, newMemberAid]
        };
      }
      return org;
    });

    saveOrganizations(updated);
    setSelectedOrg({
      ...selectedOrg,
      memberAids: [...selectedOrg.memberAids, newMemberAid]
    });
    setNewMemberAid('');
  };

  const handleRemoveMember = (memberAid: string) => {
    if (!selectedOrg) return;

    const updated = organizations.map(org => {
      if (org.id === selectedOrg.id) {
        return {
          ...org,
          memberAids: org.memberAids.filter(aid => aid !== memberAid)
        };
      }
      return org;
    });

    saveOrganizations(updated);
    setSelectedOrg({
      ...selectedOrg,
      memberAids: selectedOrg.memberAids.filter(aid => aid !== memberAid)
    });
  };

  const handleAssignCredentials = () => {
    if (!selectedOrg || selectedCredentials.length === 0) return;

    const updated = organizations.map(org => {
      if (org.id === selectedOrg.id) {
        return {
          ...org,
          credentials: [...new Set([...org.credentials, ...selectedCredentials])]
        };
      }
      return org;
    });

    saveOrganizations(updated);
    setSelectedOrg({
      ...selectedOrg,
      credentials: [...new Set([...selectedOrg.credentials, ...selectedCredentials])]
    });
    setSelectedCredentials([]);
  };

  const handleDeleteOrg = (orgId: string) => {
    if (window.confirm('Are you sure you want to delete this organization?')) {
      const updated = organizations.filter(org => org.id !== orgId);
      saveOrganizations(updated);
      if (selectedOrg?.id === orgId) {
        setShowManageModal(false);
        setSelectedOrg(null);
      }
    }
  };

  const getAidName = (aidPrefix: string) => {
    const aid = aids.find(a => a.i === aidPrefix);
    return aid ? `${aid.name} (${aidPrefix.slice(0, 12)}...)` : `${aidPrefix.slice(0, 12)}...`;
  };

  const getCredentialInfo = (credSaid: string) => {
    const cred = credentials.find(c => c.said === credSaid);
    if (cred) {
      const data = cred.data || cred.sad?.a || {};
      return data.entityName || data.organization || data.subject || 'Unknown Credential';
    }
    return 'Unknown Credential';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Organizations</h2>
          <div className="space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
            >
              Create Organization
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <div key={org.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">{org.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{org.description}</p>
                
                <div className="mt-4 space-y-2">
                  <div>
                    <span className="text-xs font-medium text-gray-500">Admins: </span>
                    <span className="text-xs text-gray-700">{org.adminAids.length}</span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">Members: </span>
                    <span className="text-xs text-gray-700">{org.memberAids.length}</span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">Credentials: </span>
                    <span className="text-xs text-gray-700">{org.credentials.length}</span>
                  </div>
                </div>
                
                <div className="mt-4 space-x-2">
                  <button
                    onClick={() => {
                      setSelectedOrg(org);
                      setShowManageModal(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    Manage
                  </button>
                  <button
                    onClick={() => handleDeleteOrg(org.id)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {organizations.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No organizations yet. Create one to get started.</p>
            </div>
          )}
        </div>

        {/* Create Organization Modal */}
        {showCreateModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity" 
                aria-hidden="true"
                onClick={() => setShowCreateModal(false)}
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 relative z-20">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Create New Organization
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Organization Name
                      </label>
                      <input
                        type="text"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={newOrgData.name}
                        onChange={(e) => setNewOrgData({ ...newOrgData, name: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        rows={3}
                        value={newOrgData.description}
                        onChange={(e) => setNewOrgData({ ...newOrgData, description: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Admin AID
                      </label>
                      <select
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        value={newOrgData.adminAid}
                        onChange={(e) => setNewOrgData({ ...newOrgData, adminAid: e.target.value })}
                      >
                        <option value="">Select an AID...</option>
                        {aids.map((aid) => (
                          <option key={aid.i} value={aid.i}>
                            {aid.name} ({aid.i.slice(0, 12)}...)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    onClick={handleCreateOrg}
                    disabled={!newOrgData.name || !newOrgData.adminAid}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewOrgData({ name: '', description: '', adminAid: '' });
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manage Organization Modal */}
        {showManageModal && selectedOrg && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity" 
                aria-hidden="true"
                onClick={() => setShowManageModal(false)}
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full sm:p-6 relative z-20">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Manage {selectedOrg.name}
                  </h3>
                  
                  <div className="mt-6 space-y-6">
                    {/* Members Section */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Members</h4>
                      <div className="mt-2 space-y-2">
                        {selectedOrg.memberAids.map((memberAid) => (
                          <div key={memberAid} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm">{getAidName(memberAid)}</span>
                            <button
                              onClick={() => handleRemoveMember(memberAid)}
                              className="text-red-600 hover:text-red-900 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        
                        {selectedOrg.memberAids.length === 0 && (
                          <p className="text-sm text-gray-500">No members yet</p>
                        )}
                        
                        <div className="flex space-x-2 mt-3">
                          <input
                            type="text"
                            placeholder="Member AID prefix"
                            className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={newMemberAid}
                            onChange={(e) => setNewMemberAid(e.target.value)}
                          />
                          <button
                            onClick={handleAddMember}
                            disabled={!newMemberAid}
                            className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50"
                          >
                            Add Member
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Credentials Section */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Associated Credentials</h4>
                      <div className="mt-2 space-y-2">
                        {selectedOrg.credentials.map((credSaid) => (
                          <div key={credSaid} className="p-2 bg-gray-50 rounded">
                            <span className="text-sm">{getCredentialInfo(credSaid)}</span>
                            <span className="text-xs text-gray-500 ml-2">({credSaid.slice(0, 12)}...)</span>
                          </div>
                        ))}
                        
                        {selectedOrg.credentials.length === 0 && (
                          <p className="text-sm text-gray-500">No credentials assigned</p>
                        )}
                        
                        {credentials.length > 0 && (
                          <div className="mt-3">
                            <select
                              multiple
                              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              size={3}
                              value={selectedCredentials}
                              onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, option => option.value);
                                setSelectedCredentials(selected);
                              }}
                            >
                              {credentials
                                .filter(cred => !selectedOrg.credentials.includes(cred.said))
                                .map((cred) => (
                                  <option key={cred.said} value={cred.said}>
                                    {getCredentialInfo(cred.said)}
                                  </option>
                                ))}
                            </select>
                            <button
                              onClick={handleAssignCredentials}
                              disabled={selectedCredentials.length === 0}
                              className="mt-2 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
                            >
                              Assign Selected Credentials
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 sm:mt-6">
                  <button
                    type="button"
                    onClick={() => setShowManageModal(false)}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};