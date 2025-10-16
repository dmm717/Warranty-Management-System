import React, { useState } from "react";
import AssignTechnicianModal from "./AssignTechnicianModal";

const AssignTechnicianManagement = ({ campaigns = [], technicians = [] }) => {
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [notification, setNotification] = useState(null);

  console.log("✅ Component rendered");
  console.log("📊 Campaigns:", campaigns);
  console.log("👨‍💼 Technicians:", technicians);

  const openModal = (campaign) => {
    console.log("🔓 Opening modal for:", campaign.CampaignsTypeName);
    setSelectedCampaign(campaign);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCampaign(null);
  };

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAssign = (campaignId, technicianId) => {
    const technician = technicians.find(t => t.SC_TechnicianID === technicianId);
    const campaign = campaigns.find(c => c.CampaignsID === campaignId);
    
    if (technician && campaign) {
      const alreadyAssigned = assignments.some(
        a => a.CampaignsID === campaignId && a.SC_TechnicianID === technicianId
      );

      if (!alreadyAssigned) {
        setAssignments([
          ...assignments,
          {
            SC_TechnicianID: technicianId,
            CampaignsID: campaignId
          }
        ]);
        console.log("✅ Assigned:", { SC_TechnicianID: technicianId, CampaignsID: campaignId });
        console.log("📊 All assignments:", assignments);
        showNotification(
          `✅ Assigned ${technician.SC_TechnicianName} to ${campaign.CampaignsTypeName}`,
          "success"
        );
      } else {
        showNotification("⚠️ Already assigned!", "error");
      }
    }
  };

  const handleRemove = (campaignId, technicianId) => {
    const technician = technicians.find(t => t.SC_TechnicianID === technicianId);
    setAssignments(
      assignments.filter(
        a => !(a.CampaignsID === campaignId && a.SC_TechnicianID === technicianId)
      )
    );
    console.log("❌ Removed:", { SC_TechnicianID: technicianId, CampaignsID: campaignId });
    showNotification(
      `❌ Removed ${technician.SC_TechnicianName}`,
      "success"
    );
  };

  const getAssignedTechnicians = (campaignId) => {
    return assignments
      .filter(a => a.CampaignsID === campaignId)
      .map(a => technicians.find(t => t.SC_TechnicianID === a.SC_TechnicianID))
      .filter(Boolean);
  };

  const getAssignedCampaigns = (technicianId) => {
    return assignments
      .filter(a => a.SC_TechnicianID === technicianId)
      .map(a => campaigns.find(c => c.CampaignsID === a.CampaignsID))
      .filter(Boolean);
  };

  if (!campaigns.length) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Assign Technician</h2>
        <p className="text-gray-500">No campaigns available</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Many-to-Many Assignment</h2>

      {notification && (
        <div
          className={`mb-4 p-4 rounded ${
            notification.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Table */}
        <div>
          <h3 className="text-lg font-bold mb-3">📋 Campaigns ({campaigns.length})</h3>
          <div className="overflow-x-auto border border-gray-300 rounded">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="px-4 py-2 text-left">Campaign</th>
                  <th className="px-4 py-2 text-center">Tech Count</th>
                  <th className="px-4 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign, idx) => {
                  const assignedTechs = getAssignedTechnicians(campaign.CampaignsID);
                  return (
                    <tr
                      key={campaign.CampaignsID}
                      className={`border-b border-gray-300 ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold">{campaign.CampaignsTypeName}</div>
                        <div className="text-xs text-gray-500">{campaign.CampaignsID}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
                          {assignedTechs.length}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openModal(campaign)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs rounded"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Technician Table */}
        <div>
          <h3 className="text-lg font-bold mb-3">👨‍💼 Technicians ({technicians.length})</h3>
          <div className="overflow-x-auto border border-gray-300 rounded">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="px-4 py-2 text-left">Technician</th>
                  <th className="px-4 py-2 text-center">Campaign Count</th>
                </tr>
              </thead>
              <tbody>
                {technicians.map((tech, idx) => {
                  const assignedCampaigns = getAssignedCampaigns(tech.SC_TechnicianID);
                  return (
                    <tr
                      key={tech.SC_TechnicianID}
                      className={`border-b border-gray-300 ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold">{tech.SC_TechnicianName}</div>
                        <div className="text-xs text-gray-500">{tech.SC_TechnicianID}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">
                          {assignedCampaigns.length}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assignments Table */}
        <div>
          <h3 className="text-lg font-bold mb-3">🔗 Assignments ({assignments.length})</h3>
          <div className="overflow-x-auto border border-gray-300 rounded">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-100 border-b border-gray-300">
                  <th className="px-4 py-2 text-left">Tech ID</th>
                  <th className="px-4 py-2 text-left">Campaign ID</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length > 0 ? (
                  assignments.map((assignment, idx) => (
                    <tr key={idx} className={`border-b border-gray-300 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                      <td className="px-4 py-3 font-mono text-blue-600 font-bold">
                        {assignment.SC_TechnicianID}
                      </td>
                      <td className="px-4 py-3 font-mono text-purple-600 font-bold">
                        {assignment.CampaignsID}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="px-4 py-3 text-center text-gray-400 italic text-xs">
                      No assignments
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AssignTechnicianModal
        isOpen={isModalOpen}
        onClose={closeModal}
        campaign={selectedCampaign}
        technicians={technicians}
        assignments={assignments}
        onAssign={handleAssign}
        onRemove={handleRemove}
      />
    </div>
  );
};

export default AssignTechnicianManagement;