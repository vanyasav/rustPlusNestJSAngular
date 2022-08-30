import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IServer } from './interfaces/server.model';

const api = '/api';

@Injectable({
  providedIn: 'root',
})
export class ServersService {
  constructor(private http: HttpClient) {}

  public getServers(): Observable<IServer[]> {
    return this.http.get<Array<IServer>>(`${api}/servers`);
  }
}
