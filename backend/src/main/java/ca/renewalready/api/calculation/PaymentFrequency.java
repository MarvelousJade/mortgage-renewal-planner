package ca.renewalready.api.calculation;

public enum PaymentFrequency {
    MONTHLY(12, false, 1),
    BIWEEKLY(26, false, 1),
    ACCELERATED_BIWEEKLY(26, true, 2),
    WEEKLY(52, false, 1),
    ACCELERATED_WEEKLY(52, true, 4);

    private final int paymentsPerYear;
    private final boolean accelerated;
    private final int monthlyPaymentDivisor;

    PaymentFrequency(int paymentsPerYear, boolean accelerated, int monthlyPaymentDivisor) {
        this.paymentsPerYear = paymentsPerYear;
        this.accelerated = accelerated;
        this.monthlyPaymentDivisor = monthlyPaymentDivisor;
    }

    public int paymentsPerYear() {
        return paymentsPerYear;
    }

    public boolean accelerated() {
        return accelerated;
    }

    public int monthlyPaymentDivisor() {
        return monthlyPaymentDivisor;
    }
}
