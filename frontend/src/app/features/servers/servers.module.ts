import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ServersRoutingModule } from './servers-routing.module';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { ServerCardComponent } from './server-card/server-card.component';
import { ServerListComponent } from './server-list/server-list.component';
import { MatCardModule } from '@angular/material/card';
import { CreateServerComponent } from './create-server/create-server.component';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
  declarations: [
    ServerCardComponent,
    ServerListComponent,
    CreateServerComponent,
  ],
  imports: [
    CommonModule,
    ServersRoutingModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    ServersRoutingModule,
    MatCardModule,
    MatButtonModule,
    MatDialogModule,
  ],
})
export class ServersModule {}
