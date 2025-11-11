import React from 'react';
import '../../styles/ShippingOrderDetail.css';

const ShippingOrderDetail = ({ order, onClose }) => {
  const getStatusText = (status) => {
    const statusMap = {
      'ready_to_pick': 'Chờ lấy hàng',
      'picking': 'Đang lấy hàng',
      'picked': 'Đã lấy hàng',
      'storing': 'Lưu kho',
      'transporting': 'Đang vận chuyển',
      'sorting': 'Đang phân loại',
      'delivering': 'Đang giao hàng',
      'delivered': 'Đã giao hàng',
      'delivery_fail': 'Giao hàng thất bại',
      'waiting_to_return': 'Chờ trả hàng',
      'return': 'Đang trả hàng',
      'returned': 'Đã trả hàng',
      'cancel': 'Đã hủy',
      'exception': 'Ngoại lệ',
      'damage': 'Hàng hư hỏng',
      'lost': 'Thất lạc',
    };
    return statusMap[status] || status;
  };

  const ghnDetail = order.ghnDetail || {};
  const partsRequest = order.partsRequest || {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Chi tiết đơn giao hàng</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Mã đơn hàng */}
          <div className="detail-section">
            <h3>📋 Thông tin đơn hàng</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">Mã đơn GHN:</span>
                <span className="value font-semibold">{order.order_code}</span>
              </div>
              <div className="detail-item">
                <span className="label">Mã vận đơn:</span>
                <span className="value">{ghnDetail.order_code || order.order_code}</span>
              </div>
              <div className="detail-item">
                <span className="label">Trạng thái:</span>
                <span className="value">
                  <span className={`status-badge status-${order.status?.toLowerCase()}`}>
                    {getStatusText(order.status)}
                  </span>
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Ngày tạo:</span>
                <span className="value">
                  {new Date(order.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>
          </div>

          {/* Thông tin phụ tùng */}
          <div className="detail-section">
            <h3>📦 Thông tin phụ tùng</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">Tên phụ tùng:</span>
                <span className="value">{partsRequest.partTypeName}</span>
              </div>
              <div className="detail-item">
                <span className="label">Số lượng:</span>
                <span className="value">{partsRequest.quantity}</span>
              </div>
              <div className="detail-item">
                <span className="label">Chi nhánh SC:</span>
                <span className="value">{partsRequest.scBranchOffice}</span>
              </div>
              <div className="detail-item">
                <span className="label">Lý do yêu cầu:</span>
                <span className="value">{partsRequest.reason}</span>
              </div>
            </div>
          </div>

          {/* Thông tin người gửi */}
          <div className="detail-section">
            <h3>📤 Người gửi (EVM)</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">Địa chỉ:</span>
                <span className="value">{order.return_address}</span>
              </div>
              <div className="detail-item">
                <span className="label">Số điện thoại:</span>
                <span className="value">{order.return_phone}</span>
              </div>
            </div>
          </div>

          {/* Thông tin người nhận */}
          <div className="detail-section">
            <h3>📥 Người nhận (SC)</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">Tên:</span>
                <span className="value">{order.to_name}</span>
              </div>
              <div className="detail-item">
                <span className="label">Số điện thoại:</span>
                <span className="value">{order.to_phone}</span>
              </div>
              <div className="detail-item full-width">
                <span className="label">Địa chỉ:</span>
                <span className="value">{order.to_address}</span>
              </div>
            </div>
          </div>

          {/* Thông tin vận chuyển */}
          <div className="detail-section">
            <h3>🚚 Thông tin vận chuyển</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">Khối lượng:</span>
                <span className="value">{order.weight} gram</span>
              </div>
              <div className="detail-item">
                <span className="label">Kích thước:</span>
                <span className="value">
                  {order.length} x {order.width} x {order.height} cm
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Phí vận chuyển:</span>
                <span className="value font-semibold text-primary">
                  {order.total_fee?.toLocaleString('vi-VN')} đ
                </span>
              </div>
              {order.expected_delivery_time && (
                <div className="detail-item">
                  <span className="label">Thời gian dự kiến:</span>
                  <span className="value">
                    {new Date(order.expected_delivery_time * 1000).toLocaleString('vi-VN')}
                  </span>
                </div>
              )}
              <div className="detail-item">
                <span className="label">Hình thức thanh toán:</span>
                <span className="value">
                  {order.payment_type_id === 1 ? 'Người gửi trả phí' : 'Người nhận trả phí'}
                </span>
              </div>
              {order.note && (
                <div className="detail-item full-width">
                  <span className="label">Ghi chú:</span>
                  <span className="value">{order.note}</span>
                </div>
              )}
            </div>
          </div>

          {/* Lịch sử trạng thái */}
          {ghnDetail.log && ghnDetail.log.length > 0 && (
            <div className="detail-section">
              <h3>📜 Lịch sử trạng thái</h3>
              <div className="timeline">
                {ghnDetail.log.map((log, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="timeline-time">
                        {new Date(log.updated_date).toLocaleString('vi-VN')}
                      </div>
                      <div className="timeline-status">
                        {getStatusText(log.status)}
                      </div>
                      {log.note && (
                        <div className="timeline-note">{log.note}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShippingOrderDetail;
