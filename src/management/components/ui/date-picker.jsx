import React from 'react';
import { Button } from './button';
import { Input } from './input';
import { CalendarIcon } from 'lucide-react';

export function DatePickerWithRange({ date, setDate, placeholder = "Pick a date range" }) {
  const handleFromChange = (e) => {
    const fromDate = e.target.value ? new Date(e.target.value) : null;
    setDate({ from: fromDate, to: date?.to });
  };

  const handleToChange = (e) => {
    const toDate = e.target.value ? new Date(e.target.value) : null;
    setDate({ from: date?.from, to: toDate });
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="flex items-center space-x-2">
      <CalendarIcon className="h-4 w-4 text-gray-500" />
      <Input
        type="date"
        value={formatDate(date?.from)}
        onChange={handleFromChange}
        className="w-36"
        placeholder="From"
      />
      <span className="text-gray-500">to</span>
      <Input
        type="date"
        value={formatDate(date?.to)}
        onChange={handleToChange}
        className="w-36"
        placeholder="To"
      />
    </div>
  );
}

