# DCSPanel

https://user-images.githubusercontent.com/163439/170457874-8832e124-75db-4140-a6d2-679a39b3bfaf.mp4

Operate DCS from your a web browser, which lets you do things like have CDUs on a tablet. This the very basics, and does not yet include all the controls or imagery.

### Installation and Usage

- Install DCS-BIOS. I have been using [the fork](https://github.com/DCSFlightpanels/dcs-bios), as it seems lighter weight and more up to date.
- `git clone https://github.com/glenmurphy/dcspanel/`
- `cd dcspanel`
- `cargo run`
- You probably need to grant both private and public firewall access
- Run DCS, start something like the A10C "Takeoff" instant action mission
- Right-click on the new icon in your tray and select 'Show'
- Access the webserver on port 8217 (e.g. http://localhost:8217/)
- You should see the CDU fill out

### Architecture

- `rsbios` is the module that handles the DCS-BIOS communication.
- `panel` is the module that handles the web server and the systray.
- the 'dist' folder contains all the HTML+JS that handles the frontend.

### Work needed

- Design
- Support more control types (e.g. the CDU is currently missing the rocker switches)