use std::collections::HashMap;

fn cdu_line(num: u8, base: u16, addr : u16, data : &Vec<u8>) {
    if addr >= base && addr < base + 24 {
        println!("{}: {:04x} {:04x} {:?}", num, base, addr, data);
    }
}

struct Control {
    id: String,
    name : String,
    addr: usize,
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let (tx, mut rx) = rsbios::start().await;
    let mut space: [u8; 0xFFFF] = [32; 0xFFFF];
    let mut controls: Vec<Control> = Vec::new();

    // https://raw.githubusercontent.com/DCSFlightpanels/dcs-bios/master/Scripts/DCS-BIOS/doc/json/A-10C.json
    controls.push(Control {
        id: "1".to_string(),
        name: "CDU1".to_string(),
        addr: 4544,
    });
    controls.push(Control {
        id: "2".to_string(),
        name: "CDU2".to_string(),
        addr: 4568,
    });
    controls.push(Control {
        id: "3".to_string(),
        name: "CDU3".to_string(),
        addr: 4592,
    });
    controls.push(Control {
        id: "4".to_string(),
        name: "CDU4".to_string(),
        addr: 4616,
    });

    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_millis(1000));
        let mut tick = 0;
        loop {
            tokio::select! {
                Some(msg) = rx.recv() => {
                    if let rsbios::DCSMessage::Data(addr, data) = msg {
                        let mut i: usize = addr as usize;
                        for b in data {
                            space[i] = b;
                            i += 1;
                            if i >= 0xFFFF {
                                break;
                            }
                        }

                        println!(" ");
                        for c in &controls {
                            let start = c.addr;
                            let end = c.addr + 24;
                            println!("{}, {:?}", c.name, String::from_utf8_lossy(&space[start..end].to_vec()));
                        }
                    }
                },
                _ = interval.tick() => {
                    tick += 1;
                    let _ = tx.send(rsbios::DCSMessage::Control(format!("AHCP_GUNPAC {}", tick % 3)));
                    //server.send(ClientMessage::BroadcastText("tick".to_string()));
                }
            }
        }
    });

    std::thread::park();
    
    Ok(())
}
