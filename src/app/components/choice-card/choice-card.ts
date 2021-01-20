import { Component, Input } from '@angular/core';


@Component({
  selector: 'wwd-choice-card',
  templateUrl: './choice-card.html',
  styleUrls: ['./choice-card.scss']
})
export class ChoiceCardComponent {

  @Input() public icon: string;

  public constructor() { }
}

@Component({
  selector: "wwd-choice-card-title",
  templateUrl: "./choice-card-title.html",
})
export class ChoiceCardTitleComponent { }


@Component({
  selector: "wwd-choice-card-content",
  templateUrl: "./choice-card-content.html",
})
export class ChoiceCardContentComponent { }
