import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
// For Ant Design components
import { Tag, Tooltip } from 'antd';

const DynamicTimeSlotAvailability = ({ onTimeSlotSelect }) => {
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    fetchAvailableTimeSlots();
  }, []);

  const fetchAvailableTimeSlots = async () => {
    try {
      const response = await axios.get('/api/order/availableTimeSlots');
      setTimeSlots(response.data);
    } catch (error) {
      console.error('Error fetching available time slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTagColor = (availability, isPast) => {
    if (isPast) return 'bg-gray-100 text-gray-800 border-gray-300';
    return availability > 0 ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300';
  };

  const handleSlotSelect = (slot) => {
    if (slot.availability > 0 && !slot.isPast) {
      setSelectedSlot(slot);
      onTimeSlotSelect(slot.time);
    }
  };

  if (loading) {
    return <div>Loading time slots...</div>;
  }

  return (
    <div className="time-slot-availability">
      <h4 className="text-lg font-semibold mb-2">Time Slot Availability:</h4>
      <div className="flex flex-wrap gap-2">
        {timeSlots.map((slot, index) => (
          <Tooltip key={index} content={`Estimated prep time: ${slot.estimatedPrepTime} minutes`}>
            <Tag 
              variant="secondary" 
              className={`${getTagColor(slot.availability, slot.isPast)} cursor-pointer ${selectedSlot?.time === slot.time ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => handleSlotSelect(slot)}
            >
              {slot.time} - {slot.isPast ? 'Passed' : (slot.availability > 0 ? `${slot.availability} available` : 'Full')}
            </Tag>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};

export default DynamicTimeSlotAvailability;