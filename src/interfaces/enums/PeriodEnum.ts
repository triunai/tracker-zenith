/**
 * Enum for budget period types
 * These values must match exactly with the PostgreSQL enum values
 */
export enum PeriodEnum {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}