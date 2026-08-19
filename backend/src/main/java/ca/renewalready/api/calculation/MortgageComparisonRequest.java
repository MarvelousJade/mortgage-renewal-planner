package ca.renewalready.api.calculation;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record MortgageComparisonRequest(
        @NotNull @DecimalMin("1000.00") @DecimalMax("10000000.00") BigDecimal principal,
        @Min(12) @Max(480) int remainingAmortizationMonths,
        @NotEmpty @Size(max = 3) List<@Valid MortgageOffer> offers
) {
}
