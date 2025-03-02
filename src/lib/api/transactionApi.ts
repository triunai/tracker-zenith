
import { TransactionData } from "@/types/transaction";

/**
 * Simulates saving a transaction to a backend
 * @param data Transaction data to save
 * @returns Promise that resolves to success boolean
 */
export const saveTransaction = (data: TransactionData): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const isSuccess = Math.random() < 0.9;
      console.log("Transaction saved:", data);
      resolve(isSuccess);
    }, 1500);
  });
};
