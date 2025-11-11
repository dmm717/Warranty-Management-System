import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { partsRequestAPI } from '../../services/api';
import GHNService from '../../services/GHNService';
import CreateShippingOrderModal from './CreateShippingOrderModal';
import ShippingOrderDetail from './ShippingOrderDetail';
import Swal from 'sweetalert2';
import '../../styles/ShippingManagement.css';

const ShippingManagement = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [shippingOrders, setShippingOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // pending, shipped, completed

  useEffect(() => {
    if (user.role === 'EVM_STAFF') {
      fetchApprovedRequests();
      loadShippingOrders();
      
      // Kiểm tra xem có request pending từ trang trước không
      const pendingRequest = sessionStorage.getItem('pendingShippingRequest');
      if (pendingRequest) {
        try {
          const request = JSON.parse(pendingRequest);
          sessionStorage.removeItem('pendingShippingRequest');
          // Mở modal tạo đơn ngay lập tức
          setSelectedRequest(request);
          setShowCreateModal(true);
        } catch (error) {
          console.error('Error parsing pending request:', error);
        }
      }
    }
  }, [user]);

  const fetchApprovedRequests = async () => {
    try {
      setLoading(true);
      const response = await partsRequestAPI.getAllPartsRequests({
        page: 0,
        size: 100,
      });
      
      // Lọc các yêu cầu đã duyệt nhưng chưa giao hàng
      const approvedRequests = (response.content || []).filter(
        req => req.deliveryStatus === 'APPROVED'
      );
      
      setRequests(approvedRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể tải danh sách yêu cầu',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadShippingOrders = () => {
    try {
      const savedOrders = localStorage.getItem('ghn_shipping_orders');
      if (savedOrders) {
        setShippingOrders(JSON.parse(savedOrders));
      }
    } catch (error) {
      console.error('Error loading shipping orders:', error);
    }
  };

  const saveShippingOrders = (orders) => {
    try {
      localStorage.setItem('ghn_shipping_orders', JSON.stringify(orders));
      setShippingOrders(orders);
    } catch (error) {
      console.error('Error saving shipping orders:', error);
    }
  };

  const handleCreateShipping = (request) => {
    setSelectedRequest(request);
    setShowCreateModal(true);
  };

  const handleShippingCreated = (orderData) => {
    const newOrder = {
      ...orderData,
      partsRequest: selectedRequest,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      status: 'PENDING',
    };

    const updatedOrders = [...shippingOrders, newOrder];
    saveShippingOrders(updatedOrders);
    
    setShowCreateModal(false);
    setSelectedRequest(null);
    fetchApprovedRequests();

    Swal.fire({
      icon: 'success',
      title: 'Thành công!',
      text: 'Đơn giao hàng đã được tạo thành công',
      confirmButtonColor: '#3b82f6',
    });
  };

  const handleViewDetail = async (order) => {
    try {
      // Lấy thông tin chi tiết từ GHN API
      const response = await GHNService.getOrderDetail(order.order_code);
      setSelectedOrder({
        ...order,
        ghnDetail: response.data,
      });
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching order detail:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể tải thông tin đơn hàng',
        confirmButtonColor: '#ef4444',
      });
    }
  };

  const handleRefreshStatus = async (orderCode) => {
    try {
      const response = await GHNService.getOrderStatus(orderCode);
      const updatedOrders = shippingOrders.map(order => {
        if (order.order_code === orderCode) {
          return {
            ...order,
            status: response.data.status,
            ghnStatus: response.data.status,
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      });
      
      saveShippingOrders(updatedOrders);
      
      Swal.fire({
        icon: 'success',
        title: 'Đã cập nhật!',
        text: 'Trạng thái đơn hàng đã được cập nhật',
        confirmButtonColor: '#3b82f6',
      });
    } catch (error) {
      console.error('Error refreshing status:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể cập nhật trạng thái đơn hàng',
        confirmButtonColor: '#ef4444',
      });
    }
  };

  const handleCancelOrder = async (orderCode) => {
    const result = await Swal.fire({
      title: 'Xác nhận hủy đơn?',
      text: 'Bạn có chắc muốn hủy đơn giao hàng này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hủy đơn',
      cancelButtonText: 'Không',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
    });

    if (!result.isConfirmed) return;

    try {
      await GHNService.cancelOrder([orderCode]);
      
      const updatedOrders = shippingOrders.map(order => {
        if (order.order_code === orderCode) {
          return {
            ...order,
            status: 'CANCELLED',
            cancelledAt: new Date().toISOString(),
          };
        }
        return order;
      });
      
      saveShippingOrders(updatedOrders);
      
      Swal.fire({
        icon: 'success',
        title: 'Đã hủy!',
        text: 'Đơn hàng đã được hủy thành công',
        confirmButtonColor: '#3b82f6',
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể hủy đơn hàng',
        confirmButtonColor: '#ef4444',
      });
    }
  };

  const handlePrintOrder = async (orderCode) => {
    try {
      const response = await GHNService.printOrder([orderCode]);
      if (response.data && response.data.token) {
        // Mở trang in GHN trong tab mới
        const printUrl = `https://dev-online-gateway.ghn.vn/a5/public-api/printA5?token=${response.data.token}`;
        window.open(printUrl, '_blank');
      }
    } catch (error) {
      console.error('Error printing order:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể in phiếu giao hàng',
        confirmButtonColor: '#ef4444',
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      PENDING: { text: 'Chờ lấy hàng', className: 'status-pending' },
      PICKING: { text: 'Đang lấy hàng', className: 'status-picking' },
      PICKED: { text: 'Đã lấy hàng', className: 'status-picked' },
      DELIVERING: { text: 'Đang giao', className: 'status-delivering' },
      DELIVERED: { text: 'Đã giao', className: 'status-delivered' },
      CANCELLED: { text: 'Đã hủy', className: 'status-cancelled' },
      RETURN: { text: 'Hoàn trả', className: 'status-return' },
    };
    
    const statusInfo = statusMap[status] || { text: status, className: '' };
    return (
      <span className={`status-badge ${statusInfo.className}`}>
        {statusInfo.text}
      </span>
    );
  };

  const filterOrdersByTab = () => {
    switch (activeTab) {
      case 'pending':
        return shippingOrders.filter(
          order => ['PENDING', 'PICKING', 'PICKED'].includes(order.status)
        );
      case 'shipped':
        return shippingOrders.filter(
          order => order.status === 'DELIVERING'
        );
      case 'completed':
        return shippingOrders.filter(
          order => ['DELIVERED', 'CANCELLED', 'RETURN'].includes(order.status)
        );
      default:
        return shippingOrders;
    }
  };

  if (user.role !== 'EVM_STAFF') {
    return (
      <div className="access-denied">
        <h3>Không có quyền truy cập</h3>
        <p>Chỉ EVM Staff mới có quyền quản lý giao hàng</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loading-container">Đang tải...</div>;
  }

  return (
    <div className="shipping-management">
      <div className="management-header">
        <div>
          <h2>Quản Lý Giao Hàng GHN</h2>
          <p className="management-subtitle">
            Tạo và quản lý đơn giao hàng phụ tùng qua Giao Hàng Nhanh
          </p>
        </div>
        <button
          className="btn-refresh"
          onClick={() => {
            fetchApprovedRequests();
            loadShippingOrders();
          }}
        >
          🔄 Làm mới
        </button>
      </div>

      {/* Yêu cầu chờ tạo đơn giao hàng */}
      {requests.length > 0 && (
        <div className="section">
          <h3 className="section-title">
            Yêu cầu chờ tạo đơn giao hàng ({requests.length})
          </h3>
          <div className="requests-grid">
            {requests.map((request) => (
              <div key={request.id} className="request-card">
                <div className="card-header">
                  <h4>{request.partTypeName || 'Unknown Part'}</h4>
                  <span className="badge badge-warning">Chờ giao hàng</span>
                </div>
                <div className="card-body">
                  <div className="info-row">
                    <span className="label">Số lượng:</span>
                    <span className="value">{request.quantity}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Chi nhánh SC:</span>
                    <span className="value">{request.scBranchOffice}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Lý do:</span>
                    <span className="value">{request.reason}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Ngày yêu cầu:</span>
                    <span className="value">
                      {new Date(request.requestDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
                <div className="card-footer">
                  <button
                    className="btn-primary"
                    onClick={() => handleCreateShipping(request)}
                  >
                    📦 Tạo đơn giao hàng
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danh sách đơn giao hàng */}
      <div className="section">
        <div className="section-header">
          <h3 className="section-title">
            Danh sách đơn giao hàng ({shippingOrders.length})
          </h3>
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              Chờ lấy hàng
            </button>
            <button
              className={`tab ${activeTab === 'shipped' ? 'active' : ''}`}
              onClick={() => setActiveTab('shipped')}
            >
              Đang giao
            </button>
            <button
              className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              Hoàn thành
            </button>
          </div>
        </div>

        {filterOrdersByTab().length === 0 ? (
          <div className="empty-state">
            <p>Không có đơn hàng nào</p>
          </div>
        ) : (
          <div className="orders-grid">
            {filterOrdersByTab().map((order) => (
              <div key={order.order_code} className="order-card">
                <div className="card-header">
                  <div>
                    <h4>#{order.order_code}</h4>
                    <p className="order-part-name">
                      {order.partsRequest?.partTypeName}
                    </p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
                <div className="card-body">
                  <div className="info-row">
                    <span className="label">Người nhận:</span>
                    <span className="value">{order.to_name}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">SĐT:</span>
                    <span className="value">{order.to_phone}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Địa chỉ:</span>
                    <span className="value">{order.to_address}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Phí ship:</span>
                    <span className="value font-semibold">
                      {order.total_fee?.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Ngày tạo:</span>
                    <span className="value">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
                <div className="card-footer">
                  <button
                    className="btn-secondary"
                    onClick={() => handleViewDetail(order)}
                  >
                    👁️ Chi tiết
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => handleRefreshStatus(order.order_code)}
                  >
                    🔄 Cập nhật
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => handlePrintOrder(order.order_code)}
                  >
                    🖨️ In
                  </button>
                  {['PENDING', 'PICKING'].includes(order.status) && (
                    <button
                      className="btn-danger"
                      onClick={() => handleCancelOrder(order.order_code)}
                    >
                      ❌ Hủy
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateShippingOrderModal
          request={selectedRequest}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedRequest(null);
          }}
          onSuccess={handleShippingCreated}
        />
      )}

      {showDetailModal && (
        <ShippingOrderDetail
          order={selectedOrder}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

export default ShippingManagement;
