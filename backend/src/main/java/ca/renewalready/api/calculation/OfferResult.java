package ca.renewalready.api.calculation;

import java.math.BigDecimal;

public record OfferResult(
        String name,
        BigDecimal annualInterestRate,
        int termMonths,
        PaymentFrequency paymentFrequency,
        BigDecimal regularPayment,
        BigDecimal additionalPaymentPerPeriod,
        BigDecimal lumpSumPayment,
        int paymentsDuringTerm,
        BigDecimal totalPaidDuringTerm,
        BigDecimal interestPaidDuringTerm,
        BigDecimal principalPaidDuringTerm,
        BigDecimal balanceAtTermEnd
) {
}
