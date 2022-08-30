import { Component, Input, OnInit } from '@angular/core';
import { IServer } from '../interfaces/server.model';

@Component({
  selector: 'app-server-card',
  templateUrl: './server-card.component.html',
  styleUrls: ['./server-card.component.css'],
})
export class ServerCardComponent implements OnInit {
  @Input()
  server!: IServer;
  constructor() {}

  ngOnInit(): void {}
}
