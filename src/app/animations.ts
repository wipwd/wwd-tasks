import {
  animate, state, style, transition, trigger
} from '@angular/animations';

export const InOutAnimation =
  trigger("InOutAnimation", [
    state("in", style({transform: "translateX(0%)"})),
    state("out", style({transform: "translateX(100%)"})),
    transition("in <=> out", animate("200ms ease-in")),
    transition(":enter", [
      style({transform: "translateX(100%)"}),
      animate("500ms ease-in", style({transform: "translateX(0%)"}))
    ]),
    transition(":leave", [
      style({transform: "translateX(0%)"}),
      animate("500ms ease-in", style({transform: "translateX(100%)"}))
    ])
  ]);

export const ExpandLaterallyAnimation =
  trigger("ExpandAnimation", [
    state("expanded", style({width: "100%"})),
    state("contracted", style({width: "250px"})),
    transition("expanded => contracted", [
      animate("200ms ease-in")
    ]),
    transition("contracted => expanded", [
      animate("200ms ease-in")
    ])
  ]);