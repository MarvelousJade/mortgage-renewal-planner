package ca.renewalready.api.calculation;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

@Service
public class MortgageCalculationService {

    static final String INTEREST_ASSUMPTION =
            "Canadian fixed mortgage rate: nominal annual rate compounded semi-annually, not in advance.";
    private static final int MONEY_SCALE = 2;
    private static final int RATE_SCALE = 12;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_EVEN;

    public MortgageComparisonResponse compare(MortgageComparisonRequest request) {
        List<OfferResult> results = request.offers().stream()
                .map(offer -> calculateOffer(request.principal(), request.remainingAmortizationMonths(), offer))
                .toList();

        return new MortgageComparisonResponse(
                money(request.principal()),
                request.remainingAmortizationMonths(),
                INTEREST_ASSUMPTION,
                Instant.now(),
                results
        );
    }

    OfferResult calculateOffer(BigDecimal principal, int amortizationMonths, MortgageOffer offer) {
        validateBusinessRules(principal, amortizationMonths, offer);

        BigDecimal lumpSum = money(offer.lumpSumOrZero());
        BigDecimal additionalPayment = money(offer.additionalPaymentOrZero());
        BigDecimal openingBalance = money(principal).subtract(lumpSum);
        BigDecimal balance = openingBalance;
        BigDecimal periodicRate = periodicRate(offer.annualInterestRate(), offer.paymentFrequency().paymentsPerYear());
        BigDecimal regularPayment = regularPayment(
                openingBalance,
                amortizationMonths,
                offer.annualInterestRate(),
                offer.paymentFrequency()
        );

        int scheduledPayments = paymentsInMonths(offer.termMonths(), offer.paymentFrequency().paymentsPerYear());
        int completedPayments = 0;
        BigDecimal periodicPaymentsTotal = BigDecimal.ZERO;
        BigDecimal interestTotal = BigDecimal.ZERO;

        for (int paymentNumber = 0; paymentNumber < scheduledPayments && balance.signum() > 0; paymentNumber++) {
            BigDecimal interest = money(balance.multiply(periodicRate));
            BigDecimal requestedPayment = regularPayment.add(additionalPayment);
            BigDecimal payoffAmount = balance.add(interest);
            BigDecimal actualPayment = requestedPayment.min(payoffAmount);
            BigDecimal principalPayment = actualPayment.subtract(interest);

            balance = money(balance.subtract(principalPayment).max(BigDecimal.ZERO));
            periodicPaymentsTotal = periodicPaymentsTotal.add(actualPayment);
            interestTotal = interestTotal.add(interest);
            completedPayments++;
        }

        BigDecimal endingBalance = money(balance);
        BigDecimal principalPaid = money(money(principal).subtract(endingBalance));
        BigDecimal totalPaid = money(periodicPaymentsTotal.add(lumpSum));

        return new OfferResult(
                offer.name().trim(),
                offer.annualInterestRate().setScale(3, ROUNDING),
                offer.termMonths(),
                offer.paymentFrequency(),
                regularPayment,
                additionalPayment,
                lumpSum,
                completedPayments,
                totalPaid,
                money(interestTotal),
                principalPaid,
                endingBalance
        );
    }

    private BigDecimal regularPayment(
            BigDecimal principal,
            int amortizationMonths,
            BigDecimal annualRatePercent,
            PaymentFrequency frequency
    ) {
        if (frequency.accelerated()) {
            BigDecimal monthlyPayment = annuityPayment(principal, amortizationMonths, annualRatePercent, 12);
            return monthlyPayment.divide(BigDecimal.valueOf(frequency.monthlyPaymentDivisor()), MONEY_SCALE, ROUNDING);
        }
        return annuityPayment(principal, amortizationMonths, annualRatePercent, frequency.paymentsPerYear());
    }

    private BigDecimal annuityPayment(
            BigDecimal principal,
            int amortizationMonths,
            BigDecimal annualRatePercent,
            int paymentsPerYear
    ) {
        double paymentCount = amortizationMonths / 12.0 * paymentsPerYear;
        BigDecimal rate = periodicRate(annualRatePercent, paymentsPerYear);

        if (rate.signum() == 0) {
            return principal.divide(BigDecimal.valueOf(paymentCount), MONEY_SCALE, ROUNDING);
        }

        double periodicRate = rate.doubleValue();
        double growth = Math.pow(1.0 + periodicRate, paymentCount);
        double payment = principal.doubleValue() * periodicRate * growth / (growth - 1.0);
        return money(BigDecimal.valueOf(payment));
    }

    private BigDecimal periodicRate(BigDecimal annualRatePercent, int paymentsPerYear) {
        double nominalRate = annualRatePercent.movePointLeft(2).doubleValue();
        double periodicRate = Math.pow(1.0 + nominalRate / 2.0, 2.0 / paymentsPerYear) - 1.0;
        return BigDecimal.valueOf(periodicRate).setScale(RATE_SCALE, ROUNDING);
    }

    private int paymentsInMonths(int months, int paymentsPerYear) {
        return (int) Math.round(months / 12.0 * paymentsPerYear);
    }

    private void validateBusinessRules(BigDecimal principal, int amortizationMonths, MortgageOffer offer) {
        if (offer.termMonths() > amortizationMonths) {
            throw new IllegalArgumentException("An offer term cannot exceed the remaining amortization.");
        }
        if (offer.lumpSumOrZero().compareTo(principal) >= 0) {
            throw new IllegalArgumentException("The lump-sum payment must be less than the mortgage balance.");
        }
        if (offer.additionalPaymentOrZero().compareTo(principal) > 0) {
            throw new IllegalArgumentException("The additional payment cannot exceed the mortgage balance.");
        }
    }

    private BigDecimal money(BigDecimal value) {
        return value.setScale(MONEY_SCALE, ROUNDING);
    }
}
