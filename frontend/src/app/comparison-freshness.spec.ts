import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';
import { MortgageComparisonResponse } from './mortgage.models';

// Synthetic transport fixture: these values test state ownership, not finance accuracy.
const response: MortgageComparisonResponse = {
  principal: 425000,
  remainingAmortizationMonths: 264,
  interestAssumption: 'Synthetic state fixture',
  generatedAt: '2026-10-26T00:00:00Z',
  results: [{
    name: 'Current lender', annualInterestRate: 4.79, termMonths: 60,
    paymentFrequency: 'MONTHLY', lumpSumPayment: 0, additionalPaymentPerPeriod: 0,
    regularPayment: 2500, paymentsDuringTerm: 60, totalPaidDuringTerm: 150000,
    interestPaidDuringTerm: 90000, principalPaidDuringTerm: 60000, balanceAtTermEnd: 365000,
  }],
};
const url = '/api/v1/mortgage-comparisons';

describe('Comparison freshness', () => {
  let fixture: ComponentFixture<App>;
  let app: App;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(App);
    app = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    http.verify();
  });

  function completeComparison(): void {
    app.compareOffers();
    const request = http.expectOne({ method: 'POST', url });
    expect(request.request.body.principal).toBe(425000);
    expect(request.request.body.offers.length).toBe(2);
    request.flush(response);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#results')).not.toBeNull();
  }

  const edits: Array<[string, (app: App) => void]> = [
    ['balance', (app) => app.form.controls.principal.setValue(400000)],
    ['amortization', (app) => app.form.controls.remainingAmortizationYears.setValue(20)],
    ['name', (app) => app.offers.at(0).controls.name.setValue('New name')],
    ['rate', (app) => app.offers.at(0).controls.annualInterestRate.setValue(4.25)],
    ['term', (app) => app.offers.at(0).controls.termMonths.setValue(36)],
    ['frequency', (app) => app.offers.at(0).controls.paymentFrequency.setValue('WEEKLY')],
    ['lump sum', (app) => app.offers.at(0).controls.lumpSumPayment.setValue(5000)],
    ['additional payment', (app) => app.offers.at(0).controls.additionalPaymentPerPeriod.setValue(50)],
  ];

  for (const [field, edit] of edits) {
    it(`hides completed results immediately after editing ${field}`, () => {
      completeComparison();
      edit(app);
      fixture.detectChanges();
      expect(app.comparison()).toBeNull();
      expect(fixture.nativeElement.querySelector('#results')).toBeNull();
      http.expectNone(url);
    });
  }

  for (const [action, edit] of [
    ['edit', (app: App) => app.form.controls.principal.setValue(400000)],
    ['add', (app: App) => app.addOffer()],
    ['remove', (app: App) => app.removeOffer(0)],
  ] as const) {
    it(`cancels a pending request on ${action} and releases loading`, () => {
      app.compareOffers();
      const request = http.expectOne(url);
      expect(app.loading()).toBeTrue();
      edit(app);
      expect(request.cancelled).toBeTrue();
      expect(app.loading()).toBeFalse();
      expect(app.errorMessage()).toBe('');
      // A late delivery is only possible on the broken implementation.
      if (!request.cancelled) request.flush(response);
      expect(app.comparison()).toBeNull();
    });
  }

  it('supersedes a repeated submission without an old response overwriting the new one', () => {
    app.compareOffers();
    const first = http.expectOne(url);
    app.compareOffers();
    const second = http.expectOne(url);
    expect(first.cancelled).toBeTrue();
    expect(app.loading()).toBeTrue();
    const latest = { ...response, generatedAt: '2026-10-26T00:01:00Z' };
    second.flush(latest);
    if (!first.cancelled) first.flush(response);
    expect(app.comparison()).toEqual(latest);
    expect(app.loading()).toBeFalse();
  });

  it('ignores an obsolete service failure after a newer comparison succeeds', () => {
    app.compareOffers();
    const obsolete = http.expectOne(url);
    app.compareOffers();
    http.expectOne(url).flush(response);
    if (!obsolete.cancelled) {
      obsolete.flush({ message: 'Obsolete service failure' }, { status: 503, statusText: 'Unavailable' });
    }
    expect(obsolete.cancelled).toBeTrue();
    expect(app.errorMessage()).toBe('');
    expect(app.comparison()).toEqual(response);
    expect(app.loading()).toBeFalse();
  });

  it('cancels pending HTTP work when the component is destroyed', () => {
    app.compareOffers();
    const request = http.expectOne(url);
    fixture.destroy();
    expect(request.cancelled).toBeTrue();
    expect(app.loading()).toBeFalse();
    if (!request.cancelled) request.flush(response);
    expect(app.comparison()).toBeNull();
  });

  it('preserves inputs on service failure, clears obsolete errors on edit, and retries', () => {
    const inputs = app.form.getRawValue();
    app.compareOffers();
    http.expectOne(url).flush({ message: 'Temporary service failure' }, {
      status: 503, statusText: 'Service Unavailable',
    });
    expect(app.errorMessage()).toBe('Temporary service failure');
    expect(app.loading()).toBeFalse();
    expect(app.form.getRawValue()).toEqual(inputs);
    app.form.controls.principal.setValue(400000);
    expect(app.errorMessage()).toBe('');
    app.compareOffers();
    const retry = http.expectOne(url);
    expect(retry.request.body.principal).toBe(400000);
    retry.flush({ ...response, principal: 400000 });
    expect(app.comparison()?.principal).toBe(400000);
    expect(app.loading()).toBeFalse();
  });

  it('handles a network failure without losing entered values', () => {
    const inputs = app.form.getRawValue();
    app.compareOffers();
    http.expectOne(url).error(new ProgressEvent('error'));
    expect(app.errorMessage()).toContain('unavailable');
    expect(app.form.getRawValue()).toEqual(inputs);
    expect(app.loading()).toBeFalse();
    expect(app.comparison()).toBeNull();
  });

  it('does not send invalid inputs and removes obsolete results', () => {
    completeComparison();
    app.form.controls.principal.setValue(0);
    app.compareOffers();
    http.expectNone(url);
    expect(app.comparison()).toBeNull();
    expect(app.form.controls.principal.touched).toBeTrue();
    expect(app.errorMessage()).toContain('highlighted fields');
  });

  it('invalidates results through a rendered input event', () => {
    completeComparison();
    const input = fixture.nativeElement.querySelector('[formControlName="principal"]') as HTMLInputElement;
    input.value = '400000';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(app.form.controls.principal.value).toBe(400000);
    expect(fixture.nativeElement.querySelector('#results')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Inputs changed');
  });
});
