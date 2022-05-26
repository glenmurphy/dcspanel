use std::{net::SocketAddrV4};
use tokio::net::UdpSocket;
use tokio::sync::mpsc::{unbounded_channel, UnboundedSender, UnboundedReceiver};

#[derive(Debug)]
pub enum DCSMessage {
    Data(u16, Vec<u8>),
    Control(String)
}

pub async fn start() -> (UnboundedSender<DCSMessage>, UnboundedReceiver<DCSMessage>) {
    // From us to caller
    let (dcs_tx, dcs_rx) = unbounded_channel::<DCSMessage>();

    // From caller to us
    let (control_tx, mut control_rx) = unbounded_channel::<DCSMessage>();

    tokio::spawn(async move {
        // Set up control listener
        // See also https://github.com/bltavares/multicast-socket
        // See also https://github.com/henninglive/tokio-udp-multicast-chat/blob/master/src/main.rs
        let multi_addr: SocketAddrV4 = "239.255.50.10:5010".parse().unwrap();
        let local_addr: SocketAddrV4 = "0.0.0.0:5010".parse().unwrap();

        // We use socket2 so we can set_reuse_address, as per the tokio guide
        let sock2 = socket2::Socket::new(
            socket2::Domain::IPV4,
            socket2::Type::DGRAM,
            Some(socket2::Protocol::UDP),
        ).unwrap();
        let _ = sock2.bind(&local_addr.into());
        let _ = sock2.set_reuse_address(true);
        let _ = sock2.join_multicast_v4(&multi_addr.ip(), &local_addr.ip());
        let _ = sock2.set_nonblocking(true);

        let sock = UdpSocket::from_std(sock2.into()).unwrap();
        
        // TODO: see if we need the local port
        let control_sock = UdpSocket::bind("0.0.0.0:7979").await.unwrap();
        control_sock.connect("127.0.0.1:7778").await.unwrap();

        let mut buf = [0; 1024];
        loop {
            tokio::select! {
                Ok((len, _addr)) = sock.recv_from(&mut buf) => {
                    //println!("{:?} bytes from {:?}:", len, addr);
                    //println!("{:?}", &buf[0..len]);

                    // This assumes each packet is standalone; it's possible that some
                    // cases I haven't encountered yet have data that spans packets, in
                    // which case this will fail and you should tell me.
                    assert!(buf[0..4] == [0x55, 0x55, 0x55, 0x55]);

                    let mut i: usize = 4; // skip over first 0x55 bytes
                    let mut addr: u16;
                    let mut size: usize;
                    let mut end;

                    while i < len {
                        addr = ((buf[i + 1] as u16) << 8) + (buf[i] as u16);
                        size = ((buf[i + 3] as usize) << 8) + (buf[i + 2] as usize);
                        i += 4;
                        end = i + size;
                        assert!(end <= len);

                        // println!("{:#06X}: {:?}", addr, &buf[i..end]);
                        let _ = dcs_tx.send(DCSMessage::Data(addr, buf[i..end].to_vec()));
                        i = end;
                    }

                    //tokio::task::yield_now().await;
                },
                Some(msg) = control_rx.recv() => {
                    match msg {
                        DCSMessage::Control(mut control) => {
                            println!("Sending control: {}", control);
                            control.push('\n');
                            control_sock.send(&control.as_bytes()).await.unwrap();
                        }
                        _ => {}
                    }
                }
            }
        }
    });

    (control_tx, dcs_rx)
}
