import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class AwbService {

  constructor(private http: HttpClient) { }

  generate(awbNumber: String):Observable<{awbBody: string}>{
    let body={awbnr:awbNumber};
    return this.http.post<{awbBody: string}>('/api/awb', body);
  }
}
