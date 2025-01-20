'use client';

import { useState } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from '@heroui/table';
import { Button } from '@heroui/button';
import { FileDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useTemperature } from '@/contexts/temperature-unit';
import ExportModal from './ExportModal';
import toast from 'react-hot-toast';
import { WeatherRecord } from '@/types/weather';

interface RecordsTableProps {
  records: WeatherRecord[];
  onDelete: (id: number) => Promise<void>;
  onView: (record: WeatherRecord) => void;
}

export default function RecordsTable({ records, onDelete, onView }: RecordsTableProps) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const { unit, convertTemp } = useTemperature();

  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  };

  const handleDelete = async (id: number) => {
    try {
      await onDelete(id);
      toast.success('Record deleted successfully');
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  if (records.length === 0) {
    return null;
  }

  return (
    <Card className="mt-8">
      <CardBody>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Weather Records</h2>
          <div className="flex space-x-2">
            <Button 
              color="primary" 
              variant="bordered"
              onPress={() => setIsExportModalOpen(true)}
              isDisabled={records.length === 0}
              startContent={<FileDown size={18} />}
            >
              Export Records
            </Button>
          </div>
        </div>
        <Table aria-label="Weather Records">
          <TableHeader>
            <TableColumn>Location</TableColumn>
            <TableColumn>Date Range</TableColumn>
            <TableColumn>Actions</TableColumn>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.location}</TableCell>
                <TableCell>
                  {formatDate(record.startDate)} - {formatDate(record.endDate)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      color="primary"
                      size="sm"
                      variant="light"
                      onPress={() => onView(record)}
                    >
                      View
                    </Button>
                    <Button
                      color="danger"
                      size="sm"
                      variant="light"
                      onPress={() => handleDelete(record.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <ExportModal 
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          records={records.map(record => ({
            id: record.id,
            location: record.location,
            startDate: record.startDate,
            endDate: record.endDate
          }))}
        />
      </CardBody>
    </Card>
  );
}
