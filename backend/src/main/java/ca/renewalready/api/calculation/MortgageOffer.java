package ca.renewalready.api.calculation;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record MortgageOffer(
        @NotBlank @Size(max = 60) String name,
        @NotNull @DecimalMin("0.0") @DecimalMax("25.0") BigDecimal annualInterestRate,
        @Min(6) @Max(120) int termMonths,
        @NotNull PaymentFrequency paymentFrequency,
        @DecimalMin("0.0") BigDecimal lumpSumPayment,
        @DecimalMin("0.0") BigDecimal additionalPaymentPerPeriod
) {
    public BigDecimal lumpSumOrZero() {
        return lumpSumPayment == null ? BigDecimal.ZERO : lumpSumPayment;
    }

    public BigDecimal additionalPaymentOrZero() {
        return additionalPaymentPerPeriod == null ? BigDecimal.ZERO : additionalPaymentPerPeriod;
    }
}
