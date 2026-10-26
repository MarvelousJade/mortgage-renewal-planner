import { MOCK_PLATFORM_LOCATION_CONFIG } from '@angular/common/testing';
import { provideHttpClient, HttpClient, withXsrfConfiguration } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

// GHSA-jfgx-762w-99vr: inert URLs and a synthetic cookie; transport is always mocked.
describe('HTTP XSRF origin isolation', () => {
  const cookieName = 'renewalready-xsrf-regression';
  const headerName = 'X-XSRF-REGRESSION';
  let client: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        // TestBed's default mock location has no origin; the patched interceptor needs one.
        { provide: MOCK_PLATFORM_LOCATION_CONFIG, useValue: { startUrl: location.href } },
        provideHttpClient(withXsrfConfiguration({ cookieName, headerName })),
        provideHttpClientTesting(),
      ],
    });
    document.cookie = `${cookieName}=synthetic-token; Path=/; SameSite=Lax`;
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    document.cookie = `${cookieName}=; Max-Age=0; Path=/`;
    http.verify();
  });

  it('retains XSRF protection on the same-origin comparison endpoint', () => {
    client.post('/api/v1/mortgage-comparisons', {}).subscribe();
    const request = http.expectOne('/api/v1/mortgage-comparisons');
    expect(request.request.headers.get(headerName)).toBe('synthetic-token');
    request.flush({});
  });

  const crossOriginUrls = [
    { label: 'ordinary absolute URL', url: 'https://untrusted.example.invalid/api' },
    { label: 'protocol-relative URL', url: '//untrusted.example.invalid/api' },
    { label: 'backslash-normalized URL', url: String.raw`/\untrusted.example.invalid/api` },
    { label: 'leading-space URL', url: ' //untrusted.example.invalid/api' },
    { label: 'embedded-tab URL', url: '/\t/untrusted.example.invalid/api' },
    { label: 'mixed-slash absolute URL', url: String.raw`https:/\untrusted.example.invalid/api` },
  ];

  for (const { label, url } of crossOriginUrls) {
    it(`does not attach the token to a ${label}`, () => {
      // Verify the browser really treats the fixture as cross-origin.
      expect(new URL(url, location.origin).origin).not.toBe(location.origin);
      client.post(url, {}).subscribe();
      const request = http.expectOne(url);
      expect(request.request.headers.has(headerName)).toBeFalse();
      request.flush({});
    });
  }
});
