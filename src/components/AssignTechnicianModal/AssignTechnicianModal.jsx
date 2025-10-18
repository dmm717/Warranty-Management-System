import React from "react";
import "./AssignTechnicianModal.css"
const AssignTechnicianModal = ({ 
  isOpen, 
  onClose, 
  campaign, 
  technicians = [], 
  assignments = [],
  onAssign,
  onRemove
}) => {
  if (!isOpen || !campaign) return null;

  const assignedTechs = assignments
    .filter(a => a.CampaignsID === campaign.CampaignsID)
    .map(a => a.SC_TechnicianID);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold mb-4">
          Assign Technicians to {campaign.CampaignsTypeName}
        </h3>

        {technicians.length > 0 ? (
          <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
            {technicians.map(tech => {
              const isAssigned = assignedTechs.includes(tech.SC_TechnicianID);
              return (
                <div
                  key={tech.SC_TechnicianID}
                  className="p-3 border border-gray-300 rounded hover:bg-blue-50 transition flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold">{tech.SC_TechnicianName}</div>
                    <div className="text-sm text-gray-600">ID: {tech.SC_TechnicianID}</div>
                  </div>
                  {isAssigned ? (
                    <button
                      onClick={() => onRemove(campaign.CampaignsID, tech.SC_TechnicianID)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm rounded"
                    >
                      ✓ Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => onAssign(campaign.CampaignsID, tech.SC_TechnicianID)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-sm rounded"
                    >
                      + Assign
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 mb-6">No technicians available</p>
        )}

        <button
          onClick={onClose}
          className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default AssignTechnicianModal;