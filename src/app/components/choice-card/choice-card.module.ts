import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@angular/flex-layout';

import {
  ChoiceCardComponent,
  ChoiceCardTitleComponent,
  ChoiceCardContentComponent
} from "./choice-card";


@NgModule({
  declarations: [
    ChoiceCardComponent,
    ChoiceCardTitleComponent,
    ChoiceCardContentComponent
  ],
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    FlexLayoutModule
  ],
  exports: [
    ChoiceCardComponent,
    ChoiceCardTitleComponent,
    ChoiceCardContentComponent
  ],
})
export class ChoiceCardModule { }
