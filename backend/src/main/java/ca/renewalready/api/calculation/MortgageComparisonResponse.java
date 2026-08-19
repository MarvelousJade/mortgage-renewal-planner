package ca.renewalready.api.calculation;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record MortgageComparisonResponse(
        BigDecimal principal,
        int remainingAmortizationMonths,
        String interestAssumption,
        Instant generatedAt,
        List<OfferResult> results
) {
}
