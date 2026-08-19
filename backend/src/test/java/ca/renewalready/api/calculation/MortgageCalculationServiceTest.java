package ca.renewalready.api.calculation;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MortgageCalculationServiceTest {

    private final MortgageCalculationService service = new MortgageCalculationService();

    @Test
    void calculatesCanadianMonthlyPayment() {
        MortgageOffer offer = new MortgageOffer(
                "Five-year fixed",
                new BigDecimal("5.000"),
                60,
                PaymentFrequency.MONTHLY,
                BigDecimal.ZERO,
                BigDecimal.ZERO
        );

        OfferResult result = service.calculateOffer(new BigDecimal("300000"), 300, offer);

        assertThat(result.regularPayment()).isEqualByComparingTo("1744.81");
        assertThat(result.paymentsDuringTerm()).isEqualTo(60);
        assertThat(result.balanceAtTermEnd()).isLessThan(new BigDecimal("300000"));
        assertThat(result.interestPaidDuringTerm()).isPositive();
    }

    @Test
    void acceleratedBiweeklyLeavesALowerBalanceThanMonthly() {
        MortgageOffer monthly = offer("Monthly", PaymentFrequency.MONTHLY);
        MortgageOffer accelerated = offer("Accelerated", PaymentFrequency.ACCELERATED_BIWEEKLY);

        MortgageComparisonResponse response = service.compare(new MortgageComparisonRequest(
                new BigDecimal("450000"),
                300,
                List.of(monthly, accelerated)
        ));

        assertThat(response.results()).hasSize(2);
        assertThat(response.results().get(1).balanceAtTermEnd())
                .isLessThan(response.results().get(0).balanceAtTermEnd());
    }

    @Test
    void rejectsATermLongerThanRemainingAmortization() {
        MortgageOffer offer = new MortgageOffer(
                "Invalid offer",
                new BigDecimal("4.5"),
                120,
                PaymentFrequency.MONTHLY,
                BigDecimal.ZERO,
                BigDecimal.ZERO
        );

        assertThatThrownBy(() -> service.calculateOffer(new BigDecimal("200000"), 60, offer))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot exceed");
    }

    private MortgageOffer offer(String name, PaymentFrequency frequency) {
        return new MortgageOffer(
                name,
                new BigDecimal("4.750"),
                60,
                frequency,
                BigDecimal.ZERO,
                BigDecimal.ZERO
        );
    }
}
