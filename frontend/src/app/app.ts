import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender, AfterRenderRef, Component, DestroyRef, inject, Injector, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Subject, takeUntil } from 'rxjs';
import { MortgageApiService } from './mortgage-api.service';
import {
  MortgageComparisonRequest,
  MortgageComparisonResponse,
  OfferResult,
  PaymentFrequency,
} from './mortgage.models';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, CurrencyPipe, DecimalPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly fb = inject(FormBuilder);
  private readonly mortgageApi = inject(MortgageApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly cancelComparison = new Subject<void>();
  private pendingScroll?: AfterRenderRef;

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly inputsChanged = signal(false);
  readonly comparison = signal<MortgageComparisonResponse | null>(null);
  readonly currentYear = new Date().getFullYear();

  readonly frequencyOptions: ReadonlyArray<{ value: PaymentFrequency; label: string }> = [
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'BIWEEKLY', label: 'Biweekly' },
    { value: 'ACCELERATED_BIWEEKLY', label: 'Accelerated biweekly' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'ACCELERATED_WEEKLY', label: 'Accelerated weekly' },
  ];

  readonly form = this.fb.nonNullable.group({
    principal: [425000, [Validators.required, Validators.min(1000), Validators.max(10_000_000)]],
    remainingAmortizationYears: [
      22,
      [Validators.required, Validators.min(1), Validators.max(40)],
    ],
    offers: this.fb.array([
      this.createOffer('Current lender', 4.79),
      this.createOffer('Alternative lender', 4.49),
    ]),
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      const hadComparison = this.comparison() !== null || this.loading();
      this.clearResults();
      if (hadComparison) this.inputsChanged.set(true);
    });
    this.destroyRef.onDestroy(() => this.pendingScroll?.destroy());
  }

  get offers() {
    return this.form.controls.offers;
  }

  addOffer(): void {
    if (this.offers.length < 3) {
      this.offers.push(this.createOffer(`Offer ${this.offers.length + 1}`, 4.59));
    }
  }

  removeOffer(index: number): void {
    if (this.offers.length > 1) {
      this.offers.removeAt(index);
    }
  }

  compareOffers(): void {
    // Cancel first: the old request's finalize must run before new loading starts.
    this.clearResults();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Review the highlighted fields before comparing your offers.');
      return;
    }

    const formValue = this.form.getRawValue();
    const request: MortgageComparisonRequest = {
      principal: formValue.principal,
      remainingAmortizationMonths: formValue.remainingAmortizationYears * 12,
      offers: formValue.offers.map((offer) => ({
        name: offer.name,
        annualInterestRate: offer.annualInterestRate,
        termMonths: offer.termMonths,
        paymentFrequency: offer.paymentFrequency as PaymentFrequency,
        lumpSumPayment: offer.lumpSumPayment,
        additionalPaymentPerPeriod: offer.additionalPaymentPerPeriod,
      })),
    };

    this.inputsChanged.set(false);
    this.loading.set(true);

    this.mortgageApi
      .compare(request)
      .pipe(
        takeUntil(this.cancelComparison),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.comparison.set(response);
          this.pendingScroll = afterNextRender(
            () => document.querySelector('#results')?.scrollIntoView({ behavior: 'smooth' }),
            { injector: this.injector },
          );
        },
        error: (error: HttpErrorResponse) => {
          const message = error.error?.message;
          this.errorMessage.set(
            message || 'The comparison service is unavailable. Confirm that the API is running and try again.',
          );
        },
      });
  }

  isLowestInterest(result: OfferResult): boolean {
    const results = this.comparison()?.results ?? [];
    return result.interestPaidDuringTerm === Math.min(...results.map((item) => item.interestPaidDuringTerm));
  }

  interestBarWidth(result: OfferResult): number {
    const results = this.comparison()?.results ?? [];
    const maximum = Math.max(...results.map((item) => item.interestPaidDuringTerm));
    return maximum === 0 ? 14 : Math.max(14, (result.interestPaidDuringTerm / maximum) * 100);
  }

  frequencyLabel(frequency: PaymentFrequency): string {
    return this.frequencyOptions.find((option) => option.value === frequency)?.label ?? frequency;
  }

  private createOffer(name: string, rate: number) {
    return this.fb.nonNullable.group({
      name: [name, [Validators.required, Validators.maxLength(60)]],
      annualInterestRate: [
        rate,
        [Validators.required, Validators.min(0), Validators.max(25)],
      ],
      termMonths: [60, [Validators.required, Validators.min(6), Validators.max(120)]],
      paymentFrequency: ['MONTHLY' as PaymentFrequency, Validators.required],
      lumpSumPayment: [0, [Validators.required, Validators.min(0)]],
      additionalPaymentPerPeriod: [0, [Validators.required, Validators.min(0)]],
    });
  }

  private clearResults(): void {
    this.cancelComparison.next();
    this.pendingScroll?.destroy();
    this.pendingScroll = undefined;
    this.comparison.set(null);
    this.errorMessage.set('');
  }
}
