
import Button from "./button.js";
import Rocker from "./rocker.js";
import Display from "./display.js";
import Control from "./control.js";

export default function createControl(bios, control_config, control_scheme, update_handler) {
  if (control_scheme.physical_variant == 'rocker_switch')
    return new Rocker(bios, control_config, control_scheme, update_handler);
  else if (control_scheme.physical_variant == 'push_button')
    return new Button(bios, control_config, control_scheme, update_handler);
  else if (control_scheme.control_type == 'display')
    return new Display(bios, control_config, control_scheme, update_handler);

  return new Control(bios, control_config, control_scheme, update_handler);
}