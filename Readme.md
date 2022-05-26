# DCSPanel

https://user-images.githubusercontent.com/163439/170457874-8832e124-75db-4140-a6d2-679a39b3bfaf.mp4

Operate DCS from your a web browser, which lets you do things like have CDUs on a tablet. This is just the very basics, and does not yet include all the controls or imagery required to be good. 

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
- If you want to add your own controls, edit `index.html`
- If you want to add controls from other aircraft, you'll also need to import the appropriate JSON from the DCS BIOS Ctrl-REF

### Architecture

- This contains a small webserver that serves up the panel as HTML, and routes DCS-BIOS messages to and from it via websocket
- `rsbios` is the module that handles the DCS-BIOS communication
- `panel` is the module that handles the web server and the systray
- the 'dist' folder contains all the HTML+JS that handles the frontend
- The Rust modules use the pattern of "every module is in its own thread, communicating with channels". You can see how this is all routed together in [src/main.rs](src/main.rs)

### Work needed

- Design
- More control types; currently only supports momentary buttons, 3-way momentary rockers, and text displays (all the things the A-10C CDU needs). There are many other controls needed (e.g. rotaries and toggles)
- The remaining 98% of the work
