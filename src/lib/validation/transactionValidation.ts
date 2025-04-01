import { FormErrors, TransactionData } from "@/interfaces/types/transaction";

/**
 * Validates transaction form data
 * @param data Partial transaction data to validate
 * @returns Object containing validation errors
 */
export const validateTransaction = (data: {
  date: Date;
  category: string;
  paymentMethod: string;
  description: string;
  amount: string;
}): FormErrors => {
  const newErrors: FormErrors = {};
  
  if (data.date > new Date()) {
    newErrors.date = "Date cannot be in the future";
  }
  
  if (!data.category) {
    newErrors.category = "Please select a category";
  }
  
  if (!data.paymentMethod) {
    newErrors.paymentMethod = "Please select a payment method";
  }
  
  if (!data.description.trim()) {
    newErrors.description = "Description is required";
  }
  
  const amountNum = parseFloat(data.amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    newErrors.amount = "Amount must be a positive number";
  }
  
  return newErrors;
};

/**
 * Checks if the transaction form is valid
 * @param data Form data to check
 * @returns Boolean indicating if the form is valid
 */
export const isFormValid = (data: {
  date: Date;
  category: string;
  paymentMethod: string;
  description: string;
  amount: string;
}): boolean => {
  return (
    data.category !== "" &&
    data.paymentMethod !== "" &&
    data.description.trim() !== "" &&
    parseFloat(data.amount) > 0 &&
    data.date <= new Date()
  );
};
