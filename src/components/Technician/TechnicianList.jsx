import React from "react";

const TechnicianList = ({ technicians, onEdit, onDelete }) => {
  if (!technicians || technicians.length === 0)
    return <p className="p-4 text-gray-500">Chưa có kỹ thuật viên nào.</p>;

  return (
    <table className="w-full border-collapse mt-4 border border-gray-300 text-center">
      <thead className="bg-gray-100">
        <tr>
          <th>ID</th>
          <th>Tên</th>
          <th>Email</th>
          <th>Điện thoại</th>
          <th>Chuyên môn</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {technicians.map((tech) => (
          <tr key={tech.SC_TechnicianID}>
            <td>{tech.SC_TechnicianID}</td>
            <td>{tech.Name}</td>
            <td>{tech.Email}</td>
            <td>{tech.PhoneNumber}</td>
            <td>{tech.Specialty}</td>
            <td className="space-x-2">
              <button
                onClick={() => onEdit(tech)}
                className="bg-yellow-400 text-white px-3 py-1 rounded"
              >
                Sửa
              </button>
              <button
                onClick={() => onDelete(tech.SC_TechnicianID)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Xóa
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TechnicianList;
