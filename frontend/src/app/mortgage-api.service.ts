import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  MortgageComparisonRequest,
  MortgageComparisonResponse,
} from './mortgage.models';

@Injectable({ providedIn: 'root' })
export class MortgageApiService {
  private readonly http = inject(HttpClient);
  private readonly comparisonUrl = '/api/v1/mortgage-comparisons';

  compare(request: MortgageComparisonRequest): Observable<MortgageComparisonResponse> {
    return this.http.post<MortgageComparisonResponse>(this.comparisonUrl, request);
  }
}
