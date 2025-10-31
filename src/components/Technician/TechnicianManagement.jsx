import React, { useState } from "react";
import TechnicianForm from "./TechnicianForm";
import TechnicianList from "./TechnicianList";

export const mockTechnicians = [
  {
    SC_TechnicianID: "T001",
    Name: "Nguyễn Văn A",
    Email: "vana@service.vn",
    PhoneNumber: "0901234567",
    DateOfBirth: 1990,
    Password: "123456",
    Specialty: "Phần mềm",
  },
  {
    SC_TechnicianID: "T002",
    Name: "Trần Thị B",
    Email: "tranb@service.vn",
    PhoneNumber: "0902345678",
    DateOfBirth: 1992,
    Password: "abc123",
    Specialty: "Điện",
  },
];

const TechnicianManagement = () => {
  const [technicians, setTechnicians] = useState(mockTechnicians);
  const [editing, setEditing] = useState(null);

  const handleSave = (tech) => {
    setTechnicians((prev) => {
      const exists = prev.find((t) => t.SC_TechnicianID === tech.SC_TechnicianID);
      if (exists) {
        return prev.map((t) =>
          t.SC_TechnicianID === tech.SC_TechnicianID ? tech : t
        );
      }
      return [...prev, tech];
    });
    setEditing(null);
  };

  const handleDelete = (id) => {
    setTechnicians((prev) => prev.filter((t) => t.SC_TechnicianID !== id));
  };

  return (
    <div className="technician-management p-6">
      <h2 className="text-2xl font-bold mb-4">Quản lý kỹ thuật viên</h2>
      <TechnicianForm
        onSave={handleSave}
        technician={editing}
        onCancel={() => setEditing(null)}
      />
      <TechnicianList
        technicians={technicians}
        onEdit={setEditing}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default TechnicianManagement;
