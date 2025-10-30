import React from 'react';
import { Label } from "@/components/ui/label.tsx";

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}

const FormField = ({ id, label, error, children }: FormFieldProps) => {
  return (
    <div className="flex flex-col gap-2 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4">
      <Label htmlFor={id} className="text-left sm:text-right">
        {label}
      </Label>
      <div className="sm:col-span-3">
        {children}
        {error && (
          <p className="text-destructive text-xs mt-1">{error}</p>
        )}
      </div>
    </div>
  );
};

export default FormField;
