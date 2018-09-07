import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/internal/Observable';
import {AwbModel} from '../models/awb.model';

@Injectable({
  providedIn: 'root'
})
export class AwbService {

  constructor(private http: HttpClient) {
  }

  generate(awbModel: AwbModel): Observable<{ awbBody: string }> {
    let body = awbModel;
    return this.http.post<{ awbBody: string }>('/api/awb', body);
  }
}
