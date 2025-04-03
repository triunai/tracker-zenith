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
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor={id} className="text-right">
        {label}
      </Label>
      <div className="col-span-3">
        {children}
        {error && (
          <p className="text-destructive text-xs mt-1">{error}</p>
        )}
      </div>
    </div>
  );
};

export default FormField;
