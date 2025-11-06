# 🚗 Recall Auto-Assign Vehicles API Documentation

## Overview
API để tự động gán xe (electric vehicles) vào recall dựa trên vehicle types đã chọn trong recall.

---

## 📋 Required APIs

### 1. **POST /api/recalls/{id}/auto-assign-vehicles**

**Mô tả**: Tự động tìm tất cả xe có `vehicleTypeId` khớp với recall và gán vào recall.

**Authorization**: `EVM_ADMIN`, `SC_ADMIN`

**Request**:
```http
POST /api/recalls/RE-2025-0B060617/auto-assign-vehicles
Content-Type: application/json
Authorization: Bearer <token>
```

**Backend Logic**:
```java
1. Lấy recall theo ID
2. Lấy danh sách vehicleTypeIds từ recall
3. Tìm tất cả ElectricVehicle có vehicleType.id IN (vehicleTypeIds)
4. Gán các xe này vào recall (set recall_id)
5. Trả về số lượng xe đã gán
```

**Response Success**:
```json
{
  "success": true,
  "message": "Successfully assigned vehicles to recall",
  "data": {
    "recallId": "RE-2025-0B060617",
    "assignedCount": 15,
    "vehicleIds": ["VIN123", "VIN456", "..."]
  }
}
```

**Response Error**:
```json
{
  "success": false,
  "message": "No vehicles found matching the vehicle types",
  "data": null
}
```

---

### 2. **POST /api/recalls/{id}/assign-vehicles** (Optional)

**Mô tả**: Gán danh sách xe cụ thể vào recall (manual assign).

**Request**:
```http
POST /api/recalls/RE-2025-0B060617/assign-vehicles
Content-Type: application/json
Authorization: Bearer <token>

{
  "vehicleIds": ["VIN123", "VIN456", "VIN789"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully assigned 3 vehicles",
  "data": {
    "assignedCount": 3
  }
}
```

---

### 3. **GET /api/recalls/{id}/vehicles** (Optional)

**Mô tả**: Lấy danh sách xe đã được gán vào recall.

**Request**:
```http
GET /api/recalls/RE-2025-0B060617/vehicles?page=0&size=20
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "vin": "VF8ABCDE12345678",
        "modelName": "VinFast VF8",
        "yearModelYear": 2024,
        "batteryType": "LFP 87.7 kWh",
        "assignedDate": "2025-11-05T10:30:00"
      }
    ],
    "totalElements": 15,
    "totalPages": 1,
    "size": 20,
    "number": 0
  }
}
```

---

## 🔧 Backend Implementation Example

### Java Spring Boot

```java
@RestController
@RequestMapping("/api/recalls")
@RequiredArgsConstructor
public class RecallController {

    private final RecallService recallService;
    private final ElectricVehicleRepository vehicleRepository;

    /**
     * POST /api/recalls/{id}/auto-assign-vehicles
     * Tự động gán xe theo vehicle types
     */
    @PostMapping("/{id}/auto-assign-vehicles")
    @PreAuthorize("hasAnyRole('EVM_ADMIN', 'SC_ADMIN')")
    public ResponseEntity<ApiResponse> autoAssignVehicles(@PathVariable String id) {
        try {
            // 1. Lấy recall
            Recall recall = recallService.findById(id);
            
            // 2. Lấy vehicle type IDs từ recall
            List<String> vehicleTypeIds = recall.getVehicleTypes()
                .stream()
                .map(VehicleType::getId)
                .collect(Collectors.toList());
            
            // 3. Tìm tất cả xe có vehicle type matching
            List<ElectricVehicle> vehicles = vehicleRepository
                .findByVehicleTypeIdIn(vehicleTypeIds);
            
            // 4. Gán xe vào recall
            vehicles.forEach(vehicle -> vehicle.setRecall(recall));
            vehicleRepository.saveAll(vehicles);
            
            // 5. Trả về response
            Map<String, Object> data = new HashMap<>();
            data.put("recallId", id);
            data.put("assignedCount", vehicles.size());
            data.put("vehicleIds", vehicles.stream()
                .map(ElectricVehicle::getVin)
                .collect(Collectors.toList()));
            
            return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Successfully assigned vehicles to recall")
                .data(data)
                .build());
                
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ApiResponse.builder()
                .success(false)
                .message("Error: " + e.getMessage())
                .build());
        }
    }
}
```

### Repository Method

```java
public interface ElectricVehicleRepository extends JpaRepository<ElectricVehicle, String> {
    
    /**
     * Tìm tất cả xe theo danh sách vehicle type IDs
     */
    List<ElectricVehicle> findByVehicleTypeIdIn(List<String> vehicleTypeIds);
    
    /**
     * Tìm xe chưa được assign recall
     */
    List<ElectricVehicle> findByVehicleTypeIdInAndRecallIsNull(List<String> vehicleTypeIds);
}
```

---

## 🎯 Frontend Flow

```javascript
// User clicks "Tự động gán xe" button in RecallDetail
1. Call: POST /api/recalls/{id}/auto-assign-vehicles
2. Show loading spinner
3. On success: 
   - Show toast: "Đã gán 15 xe vào recall"
   - Refresh recall detail
4. On error:
   - Show error toast
```

---

## ✅ Testing

### Test Case 1: Auto-assign thành công
```
Given: Recall có vehicleTypeIds = ["EVT004", "EVT005"]
And: Database có 15 xe với vehicleType.id = "EVT004" hoặc "EVT005"
When: Call POST /api/recalls/{id}/auto-assign-vehicles
Then: Response success = true, assignedCount = 15
And: Tất cả 15 xe có recall_id = {id}
```

### Test Case 2: Không có xe matching
```
Given: Recall có vehicleTypeIds = ["EVT999"]
And: Database không có xe nào với vehicleType.id = "EVT999"
When: Call POST /api/recalls/{id}/auto-assign-vehicles
Then: Response success = false
And: Message = "No vehicles found matching the vehicle types"
```

### Test Case 3: Recall không tồn tại
```
Given: Recall ID không tồn tại trong database
When: Call POST /api/recalls/INVALID_ID/auto-assign-vehicles
Then: Response 404 Not Found
```

---

## 📝 Notes

1. **Duplicate Assignment**: Nếu xe đã được assign recall khác, cần xử lý:
   - Option A: Override (gán lại vào recall mới)
   - Option B: Skip (giữ recall cũ)
   - Option C: Error (báo lỗi xe đã được assign)

2. **Performance**: Với số lượng xe lớn (>1000), nên:
   - Batch processing
   - Async job với notification khi hoàn thành

3. **Transaction**: Wrap logic trong `@Transactional` để rollback nếu có lỗi

4. **Audit Log**: Log lại thao tác assign để tracking

---

## 🔗 Related Endpoints

- `GET /api/recalls/{id}` - Lấy recall detail (có vehicleBasicInfoDTOS)
- `GET /api/electric-vehicles?vehicleTypeIds=EVT004,EVT005` - Query xe theo types
- `PATCH /api/recalls/{id}/status` - Update recall status

---

**Created**: 2025-11-05  
**Author**: Frontend Team  
**Status**: Pending Backend Implementation
