use tokio::sync::mpsc::{unbounded_channel, UnboundedReceiver, UnboundedSender};
use tray_item::TrayItem;

#[allow(unused)]
pub enum TrayMessage {
    On,
    Off,
    Show,
    Quit,
}

// MacOS tray blocks the main thread so only Windows allows channels to work,
// so we have this interface that will only sending on those channels if we're
// in Windows to prevent the unbounded_channel filling up. This is super daft hax.
#[allow(unused)]
pub struct TrayChannels {
    main_tx: UnboundedSender<TrayMessage>,
    tray_rx: UnboundedReceiver<TrayMessage>,
}

impl TrayChannels {
    pub fn send(&self, msg: TrayMessage) {
        #[cfg(target_os = "windows")]
        let _ = self.main_tx.send(msg);
    }
    pub async fn recv(&mut self) -> Option<TrayMessage> {
        tokio::macros::support::poll_fn(|cx| self.tray_rx.poll_recv(cx)).await
    }
}

#[allow(unused)]
pub struct Tray {
    tray_tx: UnboundedSender<TrayMessage>,
    main_rx: UnboundedReceiver<TrayMessage>,
    url: String,
}

impl Tray {
    #[cfg(target_os = "windows")]
    async fn run_win(&mut self) {
        println!("starting windows tray");
        let mut tray = TrayItem::new("Panel", "tray-off").unwrap();
        tray.add_label("Panel").unwrap();

        let url = self.url.clone();
        tray.add_menu_item("Show", move || {
            let _ = webbrowser::open(&url);
        })
        .unwrap();

        let quit_tx = self.tray_tx.clone();
        tray.add_menu_item("Quit", move || {
            let _ = quit_tx.send(TrayMessage::Quit);
        })
        .unwrap();

        while let Some(v) = self.main_rx.recv().await {
            match v {
                TrayMessage::On => {
                    tray.set_icon("tray-on").unwrap();
                }
                TrayMessage::Off => {
                    tray.set_icon("tray-off").unwrap();
                }
                TrayMessage::Quit => {
                    let _ = tray.inner_mut().quit();
                    let _ = tray.inner_mut().shutdown();
                    break;
                }
                _ => {}
            }
        }
    }

    #[allow(unused)]
    #[cfg(target_os = "macos")]
    fn run_mac(&self) {
        println!("starting mac tray");
        let mut tray = TrayItem::new("Panel", "").unwrap();
        tray.add_label("Panel").unwrap();

        let url = self.url.clone();
        tray.add_menu_item("Show", move || {
            let _ = webbrowser::open(&url);
        })
        .unwrap();

        let inner = tray.inner_mut();
        inner.add_quit_item("Quit");
        inner.display();
    }

    #[allow(unused)]
    pub fn new(port: u16) -> (Self, TrayChannels) {
        let (tray_tx, mut tray_rx) = unbounded_channel::<TrayMessage>();
        let (main_tx, main_rx) = unbounded_channel::<TrayMessage>();
        (
            Tray {
                tray_tx,
                main_rx,
                url : format!("http://localhost:{}/", port)
            },
            TrayChannels { main_tx, tray_rx },
        )
    }

    pub async fn run(&mut self) {
        // TODO: make this cross platform
        // TrayItem seems to have a different API on different platforms
        #[cfg(target_os = "windows")]
        self.run_win().await;

        // Experimental
        #[cfg(target_os = "macos")]
        self.run_mac();
    }
}
