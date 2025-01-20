'use client';

import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/modal';
import { Button } from '@heroui/button';
import { DateRangePicker } from '@heroui/react';
import { format } from 'date-fns';

interface WeatherRecord {
  id: number;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record?: WeatherRecord;
  onSave: (data: any) => Promise<void>;
}

export function RecordModal({ isOpen, onClose, record, onSave }: RecordModalProps) {
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    record ? new Date(record.startDate) : new Date(),
    record ? new Date(record.endDate) : new Date()
  ]);
  const [description, setDescription] = useState(record?.description || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      await onSave({
        id: record?.id,
        startDate: format(dateRange[0], 'yyyy-MM-dd'),
        endDate: format(dateRange[1], 'yyyy-MM-dd'),
        description,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save record:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          {record ? 'Edit Weather Record' : 'Save Weather Record'}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {record && (
              <div>
                <label className="text-sm text-gray-600">Location</label>
                <p>{record.location}</p>
              </div>
            )}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Date Range</label>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                minDate={new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)}
                maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Notes</label>
              <textarea
                className="w-full p-2 border rounded-lg"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            onClick={handleSave}
            isLoading={loading}
          >
            Save
          </Button>
          <Button
            color="neutral"
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
