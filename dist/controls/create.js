
import Button from "./button.js";
import Rocker from "./rocker.js";
import Display from "./display.js";
import Control from "./control.js";

export default function createControl(bios, control_config, control_scheme, update_handler) {
  switch (control_scheme.physical_variant) {
    case 'rocker_switch':
      return new Rocker(bios, control_config, control_scheme, update_handler);
    case 'push_button':
      return new Button(bios, control_config, control_scheme, update_handler);
    case 'display':
      return new Display(bios, control_config, control_scheme, update_handler);
    default:
      return new Control(bios, control_config, control_scheme, update_handler);
  }
}