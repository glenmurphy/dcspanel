// Hide the console on windows release builds
#![cfg_attr(
    all(target_os = "windows", not(debug_assertions)),
    windows_subsystem = "windows"
)]

use panel::web;
use panel::web::{ClientMessage as Message};
use panel::tray::{Tray, TrayMessage};

#[tokio::main]
async fn main() {
    let port = 8217;
    let (mut tray, mut tray_channels) = Tray::new(port);
    
    tokio::spawn(async move {
        let mut server = web::start(port).await;
        let (rsbios_tx, mut rsbios_rx) = rsbios::start().await;
        //let mut interval = tokio::time::interval(std::time::Duration::from_millis(5000));
        loop {
            tokio::select! {
                Some(msg) = server.recv() => {
                    match msg {
                        Message::Text(_id, msg) => {
                            //server.send(Message::BroadcastText(msg));
                            let _ = rsbios_tx.send(rsbios::DCSMessage::Control(msg));
                        },
                        Message::Clients(0) => tray_channels.send(TrayMessage::Off),
                        Message::Clients(_) => tray_channels.send(TrayMessage::On),
                        _ => {}
                    }
                },
                Some(msg) = rsbios_rx.recv() => {
                    if let rsbios::DCSMessage::Data(addr, mut data) = msg {  
                        // Makes the first two bytes match the DCS-BIOS style
                        data.insert(0, (addr >> 8) as u8);
                        data.insert(0, (addr & 0xFF) as u8);
                        server.send(Message::BroadcastData(data));
                    }
                },
                Some(msg) = tray_channels.recv() => {
                    match msg {
                        TrayMessage::Quit => {
                            // Do other shutdown here
                            tray_channels.send(TrayMessage::Quit);
                        },
                        _ => {}
                    }
                }
                //_ = interval.tick() => {
                //    server.send(ClientMessage::BroadcastText("tick".to_string()));
                //}
            }
        }
    });

    // On MacOS the tray needs to be run on the main thread
    tray.run().await;
}
