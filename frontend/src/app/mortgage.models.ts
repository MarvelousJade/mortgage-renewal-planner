export type PaymentFrequency =
  | 'MONTHLY'
  | 'BIWEEKLY'
  | 'ACCELERATED_BIWEEKLY'
  | 'WEEKLY'
  | 'ACCELERATED_WEEKLY';

export interface MortgageOfferRequest {
  name: string;
  annualInterestRate: number;
  termMonths: number;
  paymentFrequency: PaymentFrequency;
  lumpSumPayment: number;
  additionalPaymentPerPeriod: number;
}

export interface MortgageComparisonRequest {
  principal: number;
  remainingAmortizationMonths: number;
  offers: MortgageOfferRequest[];
}

export interface OfferResult extends MortgageOfferRequest {
  regularPayment: number;
  paymentsDuringTerm: number;
  totalPaidDuringTerm: number;
  interestPaidDuringTerm: number;
  principalPaidDuringTerm: number;
  balanceAtTermEnd: number;
}

export interface MortgageComparisonResponse {
  principal: number;
  remainingAmortizationMonths: number;
  interestAssumption: string;
  generatedAt: string;
  results: OfferResult[];
}
