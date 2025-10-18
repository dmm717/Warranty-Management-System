/* ==========================================================================
   APPOINTMENT SCHEDULING SERVICE - Quản lí lịch hẹn và thời gian thực hiện
   ========================================================================== */

class AppointmentSchedulingService {
  constructor() {
    this.appointments = [];
    this.schedules = [];
    this.availableSlots = [];
  }

  // Tạo lịch hẹn cho chiến dịch
  async createCampaignSchedule(campaignId, distributionData, campaignType = 'recall') {
    try {
      const schedule = {
        id: this.generateId(),
        campaignId,
        campaignType,
        totalCenters: distributionData.distributions.length,
        centerSchedules: [],
        createdAt: new Date().toISOString(),
        status: 'draft'
      };

      // Tạo lịch hẹn cho từng trung tâm
      for (const distribution of distributionData.distributions) {
        const centerSchedule = await this.createCenterSchedule(
          distribution, 
          campaignType
        );
        schedule.centerSchedules.push(centerSchedule);
      }

      await this.simulateApiCall(1000);
      
      schedule.status = 'pending_confirmation';
      this.schedules.push(schedule);

      return {
        success: true,
        scheduleId: schedule.id,
        centerSchedules: schedule.centerSchedules,
        summary: this.getScheduleSummary(schedule)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Tạo lịch cho từng trung tâm
  async createCenterSchedule(distribution, campaignType) {
    const availableSlots = this.getAvailableSlots(distribution.centerId);
    const vehicleCount = distribution.vehicleCount;
    
    // Tính toán thời gian cần thiết
    const timePerVehicle = campaignType === 'urgent_recall' ? 1.5 : 2; // hours
    const totalHours = vehicleCount * timePerVehicle;
    const workingHoursPerDay = 8;
    const daysNeeded = Math.ceil(totalHours / workingHoursPerDay);

    // Tìm slot phù hợp
    const proposedDates = this.findAvailableDates(availableSlots, daysNeeded);

    const centerSchedule = {
      centerId: distribution.centerId,
      centerName: distribution.centerName,
      vehicleCount: vehicleCount,
      estimatedDuration: daysNeeded,
      proposedStartDate: proposedDates[0],
      proposedEndDate: proposedDates[proposedDates.length - 1],
      proposedDates: proposedDates,
      timeSlots: this.generateTimeSlots(proposedDates, workingHoursPerDay),
      status: 'pending',
      confirmed: false,
      vehicleSchedules: this.createVehicleSchedules(
        distribution.assignedVehicles, 
        proposedDates,
        timePerVehicle
      )
    };

    return centerSchedule;
  }

  // Tạo lịch hẹn cụ thể cho từng xe
  createVehicleSchedules(vehicles, availableDates, timePerVehicle) {
    const schedules = [];
    const workingHoursPerDay = 8;
    const vehiclesPerDay = Math.floor(workingHoursPerDay / timePerVehicle);
    
    let currentDateIndex = 0;
    let vehiclesScheduledToday = 0;
    let currentTime = 8; // Start at 8 AM

    vehicles.forEach((vehicle, index) => {
      if (vehiclesScheduledToday >= vehiclesPerDay) {
        currentDateIndex++;
        vehiclesScheduledToday = 0;
        currentTime = 8;
      }

      const appointmentDate = availableDates[currentDateIndex];
      const startTime = `${String(Math.floor(currentTime)).padStart(2, '0')}:${String((currentTime % 1) * 60).padStart(2, '0')}`;
      
      currentTime += timePerVehicle;
      const endTime = `${String(Math.floor(currentTime)).padStart(2, '0')}:${String((currentTime % 1) * 60).padStart(2, '0')}`;

      schedules.push({
        vehicleId: vehicle.id,
        vin: vehicle.vin,
        owner: vehicle.owner,
        phone: vehicle.phone,
        appointmentDate: appointmentDate,
        timeSlot: `${startTime} - ${endTime}`,
        status: 'scheduled',
        confirmed: false,
        reminderSent: false
      });

      vehiclesScheduledToday++;
    });

    return schedules;
  }

  // Xác nhận lịch hẹn từ Service Center
  async confirmCenterSchedule(scheduleId, centerId, confirmation) {
    const schedule = this.schedules.find(s => s.id === scheduleId);
    if (!schedule) {
      return { success: false, error: 'Schedule not found' };
    }

    const centerSchedule = schedule.centerSchedules.find(cs => cs.centerId === centerId);
    if (!centerSchedule) {
      return { success: false, error: 'Center schedule not found' };
    }

    // Cập nhật xác nhận
    centerSchedule.confirmed = true;
    centerSchedule.confirmedAt = new Date().toISOString();
    centerSchedule.actualStartDate = confirmation.startDate;
    centerSchedule.actualEndDate = confirmation.endDate;
    centerSchedule.confirmationNote = confirmation.note;
    centerSchedule.status = 'confirmed';

    // Cập nhật lịch hẹn xe nếu có thay đổi
    if (confirmation.vehicleSchedules) {
      centerSchedule.vehicleSchedules = confirmation.vehicleSchedules;
    }

    await this.simulateApiCall(500);

    // Gửi thông báo xác nhận cho khách hàng
    await this.sendCustomerNotifications(centerSchedule.vehicleSchedules);

    return {
      success: true,
      message: 'Lịch hẹn đã được xác nhận thành công',
      centerSchedule: centerSchedule
    };
  }

  // Gửi nhắc nhở lịch hẹn
  async sendAppointmentReminders(scheduleId, reminderType = 'day_before') {
    const schedule = this.schedules.find(s => s.id === scheduleId);
    if (!schedule) return { success: false, error: 'Schedule not found' };

    const reminders = [];
    
    for (const centerSchedule of schedule.centerSchedules) {
      if (!centerSchedule.confirmed) continue;

      for (const vehicleSchedule of centerSchedule.vehicleSchedules) {
        if (!vehicleSchedule.reminderSent) {
          const reminder = {
            vehicleId: vehicleSchedule.vehicleId,
            owner: vehicleSchedule.owner,
            phone: vehicleSchedule.phone,
            appointmentDate: vehicleSchedule.appointmentDate,
            timeSlot: vehicleSchedule.timeSlot,
            reminderType: reminderType,
            sentAt: new Date().toISOString()
          };

          // Simulate sending SMS/Email
          await this.simulateApiCall(200);
          
          vehicleSchedule.reminderSent = true;
          reminders.push(reminder);
        }
      }
    }

    return {
      success: true,
      remindersSent: reminders.length,
      reminders: reminders
    };
  }

  // Cập nhật trạng thái lịch hẹn
  async updateAppointmentStatus(scheduleId, centerId, vehicleId, newStatus, note = '') {
    const schedule = this.schedules.find(s => s.id === scheduleId);
    if (!schedule) return { success: false, error: 'Schedule not found' };

    const centerSchedule = schedule.centerSchedules.find(cs => cs.centerId === centerId);
    if (!centerSchedule) return { success: false, error: 'Center schedule not found' };

    const vehicleSchedule = centerSchedule.vehicleSchedules.find(vs => vs.vehicleId === vehicleId);
    if (!vehicleSchedule) return { success: false, error: 'Vehicle schedule not found' };

    vehicleSchedule.status = newStatus;
    vehicleSchedule.statusNote = note;
    vehicleSchedule.statusUpdatedAt = new Date().toISOString();

    return {
      success: true,
      message: `Trạng thái lịch hẹn đã được cập nhật thành ${newStatus}`,
      vehicleSchedule: vehicleSchedule
    };
  }

  // Lấy báo cáo lịch hẹn
  getScheduleReport(scheduleId) {
    const schedule = this.schedules.find(s => s.id === scheduleId);
    if (!schedule) return null;

    let totalVehicles = 0;
    let confirmedCenters = 0;
    let completedAppointments = 0;
    let pendingAppointments = 0;

    schedule.centerSchedules.forEach(cs => {
      totalVehicles += cs.vehicleCount;
      if (cs.confirmed) confirmedCenters++;
      
      cs.vehicleSchedules.forEach(vs => {
        if (vs.status === 'completed') completedAppointments++;
        else if (vs.status === 'scheduled') pendingAppointments++;
      });
    });

    return {
      scheduleId: schedule.id,
      campaignId: schedule.campaignId,
      totalCenters: schedule.totalCenters,
      confirmedCenters: confirmedCenters,
      totalVehicles: totalVehicles,
      completedAppointments: completedAppointments,
      pendingAppointments: pendingAppointments,
      completionRate: Math.round((completedAppointments / totalVehicles) * 100),
      centerSchedules: schedule.centerSchedules,
      createdAt: schedule.createdAt
    };
  }

  // Utility methods
  getAvailableSlots(centerId) {
    // Mock available slots - trong thực tế sẽ lấy từ database
    const today = new Date();
    const slots = [];
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        slots.push({
          date: date.toISOString().split('T')[0],
          available: Math.random() > 0.3, // 70% chance of availability
          capacity: Math.floor(Math.random() * 20) + 10
        });
      }
    }
    
    return slots;
  }

  findAvailableDates(slots, daysNeeded) {
    const availableDates = [];
    const availableSlots = slots.filter(slot => slot.available);
    
    for (let i = 0; i < Math.min(daysNeeded, availableSlots.length); i++) {
      availableDates.push(availableSlots[i].date);
    }
    
    return availableDates;
  }

  generateTimeSlots(dates, hoursPerDay) {
    const timeSlots = [];
    
    dates.forEach(date => {
      const slots = [];
      for (let hour = 8; hour < 8 + hoursPerDay; hour += 2) {
        slots.push(`${hour}:00 - ${hour + 2}:00`);
      }
      
      timeSlots.push({
        date: date,
        slots: slots
      });
    });
    
    return timeSlots;
  }

  async sendCustomerNotifications(vehicleSchedules) {
    // Mock sending notifications
    for (const schedule of vehicleSchedules) {
      await this.simulateApiCall(100);
      // In reality, this would send SMS/Email to customer
    }
  }

  getScheduleSummary(schedule) {
    const totalVehicles = schedule.centerSchedules.reduce((sum, cs) => sum + cs.vehicleCount, 0);
    const earliestDate = Math.min(...schedule.centerSchedules.map(cs => new Date(cs.proposedStartDate)));
    const latestDate = Math.max(...schedule.centerSchedules.map(cs => new Date(cs.proposedEndDate)));
    
    return {
      totalVehicles: totalVehicles,
      totalCenters: schedule.totalCenters,
      scheduleSpan: Math.ceil((latestDate - earliestDate) / (1000 * 60 * 60 * 24)) + 1,
      earliestStartDate: new Date(earliestDate).toISOString().split('T')[0],
      latestEndDate: new Date(latestDate).toISOString().split('T')[0]
    };
  }

  generateId() {
    return 'SCHED' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  async simulateApiCall(delay = 500) {
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Tạo singleton instance
const appointmentSchedulingService = new AppointmentSchedulingService();
export default appointmentSchedulingService;