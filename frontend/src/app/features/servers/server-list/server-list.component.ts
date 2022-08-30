import { Component, OnInit } from '@angular/core';
import { IServer } from '../interfaces/server.model';
import { ServersService } from '../servers.service';
import { Observable } from 'rxjs';
import { CreateServerComponent } from '../create-server/create-server.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-server-list',
  templateUrl: './server-list.component.html',
  styleUrls: ['./server-list.component.css'],
})
export class ServerListComponent implements OnInit {
  constructor(
    private serversService: ServersService,
    public dialog: MatDialog
  ) {}

  $servers!: Observable<Array<IServer>>;

  ngOnInit(): void {
    this.$servers = this.serversService.getServers();
  }

  createServer() {
    this.dialog.open(CreateServerComponent, {
      width: '500px',
      autoFocus: false,
    });
  }
}
