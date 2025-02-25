'use client';

import { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Button } from '@heroui/button';
import { Checkbox } from '@heroui/checkbox';
import { Select, SelectItem } from '@heroui/select';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

import { downloadFile, ExportFormat, validFormats } from '@/lib/export-utils';

interface ExportRecord {
  id: number;
  location: string;
  startDate: string;
  endDate: string;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: ExportRecord[];
}

export default function ExportModal({ isOpen, onClose, records }: ExportModalProps) {
  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');

  const handleRecordSelect = (recordId: number) => {
    setSelectedRecords((prev) =>
      prev.includes(recordId) ? prev.filter((id) => id !== recordId) : [...prev, recordId]
    );
  };

  const handleSelectAll = () => {
    setSelectedRecords(
      selectedRecords.length === records.length ? [] : records.map((record) => record.id)
    );
  };

  const handleExport = async () => {
    if (selectedRecords.length === 0) {
      toast.error('Please select at least one record to export');
      return;
    }

    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'export',
          recordIds: selectedRecords.map(id => Number(id)),
          format: exportFormat,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Export failed with status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.content || !result.filename || !result.mimeType) {
        throw new Error('Invalid response format from server');
      }

      downloadFile(result.content, `${result.filename}.${exportFormat}`, result.mimeType);
      toast.success(`Exported ${selectedRecords.length} records successfully`);
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during export';
      toast.error(errorMessage);
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = format(parseISO(startDate), 'MMM d, yyyy');
    const end = format(parseISO(endDate), 'MMM d, yyyy');

    return `${start} - ${end}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Export Weather Records</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Select Records to Export</span>
              <Button size="sm" variant="ghost" onClick={handleSelectAll}>
                {selectedRecords.length === records.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {records.map((record) => (
                <div key={record.id} className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    isSelected={selectedRecords.includes(record.id)}
                    onValueChange={() => handleRecordSelect(record.id)}
                  />
                  <span>
                    {record.location} ({formatDateRange(record.startDate, record.endDate)})
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <label htmlFor="export-format" className="block mb-2">Export Format</label>
              <Select
                id="export-format"
                selectedKeys={[exportFormat]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as ExportFormat;

                  setExportFormat(selected);
                }}
              >
                {validFormats.map((format) => (
                  <SelectItem key={format} value={format}>
                    {format.toUpperCase()}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" isDisabled={selectedRecords.length === 0} onPress={handleExport}>
            Export
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
