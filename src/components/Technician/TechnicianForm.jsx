import React, { useState, useEffect } from "react";

const TechnicianForm = ({ onSave, technician, onCancel }) => {
  const [formData, setFormData] = useState({
    SC_TechnicianID: "",
    Name: "",
    Email: "",
    PhoneNumber: "",
    DateOfBirth: "",
    Password: "",
    Specialty: "",
  });

  useEffect(() => {
    if (technician) setFormData(technician);
  }, [technician]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setFormData({
      SC_TechnicianID: "",
      Name: "",
      Email: "",
      PhoneNumber: "",
      DateOfBirth: "",
      Password: "",
      Specialty: "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md bg-white">
      <h3 className="text-lg font-bold">
        {technician ? "Cập nhật kỹ thuật viên" : "Thêm kỹ thuật viên"}
      </h3>

      {Object.keys(formData).map((key) => (
        <div key={key}>
          <label className="block font-medium mb-1">{key}</label>
          <input
            type={key === "DateOfBirth" ? "number" : "text"}
            name={key}
            value={formData[key]}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>
      ))}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 px-4 py-2 rounded"
        >
          Hủy
        </button>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Lưu
        </button>
      </div>
    </form>
  );
};

export default TechnicianForm;
