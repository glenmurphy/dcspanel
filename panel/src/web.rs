use axum::extract::Extension;
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        TypedHeader,
    },
    response::IntoResponse,
    routing::get,
    Router,
};
use axum_extra::routing::SpaRouter;
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use tokio::sync::mpsc::{unbounded_channel, UnboundedReceiver, UnboundedSender};

#[allow(unused)]
pub enum ClientMessage {
    Text(u32, String),      // bi-directional: client id, string
    Data(u32, Vec<u8>),     // bi-directional: client id, string
    BroadcastText(String),  // server to all clients
    BroadcastData(Vec<u8>), // server to all clients
    Connected(u32, UnboundedSender<ClientMessage>),
    Disconnected(u32),
    Clients(u32), // Number of connected clients
}

struct AppState {
    max_id: Mutex<u32>,
    client_tx: UnboundedSender<ClientMessage>, // to be cloned by each client
}

fn get_client_id(state: &Arc<AppState>) -> u32 {
    let mut user_id = state.max_id.lock().unwrap(); // dropped at end of this function
    *user_id += 1;
    *user_id
}

async fn handle_socket(mut socket: WebSocket, state: Arc<AppState>) {
    // Add client to state
    let client_id = get_client_id(&state);
    let (server_tx, mut server_rx) = unbounded_channel::<ClientMessage>(); // from server to client
    let _ = state
        .client_tx
        .send(ClientMessage::Connected(client_id, server_tx));

    tokio::spawn(async move {
        loop {
            tokio::select! {
                Some(msg) = socket.recv() => {
                    //socket.send(msg).await.unwrap();
                    if let Ok(msg) = msg {
                        match msg {
                            Message::Text(t) => {
                                println!("socket: client {} sent str: {:?}", client_id, t);
                                let _ = state.client_tx.send(ClientMessage::Text(client_id, t));
                             }
                            Message::Binary(b) => {
                                println!("socket: client {} sent data: {:?}", client_id, b);
                                let _ = state.client_tx.send(ClientMessage::Data(client_id, b));
                            }
                            Message::Close(_) => {
                                let _ = state.client_tx.send(ClientMessage::Disconnected(client_id));
                                return;
                            }
                            _ => {}
                        }
                    } else {
                        let _ = state.client_tx.send(ClientMessage::Disconnected(client_id));
                        return;
                    }
                },
                Some(msg) = server_rx.recv() => {
                    match msg {
                        ClientMessage::Text(id, t) => {
                            println!("socket: server sending '{:?}' to {}", t, id);
                            socket.send(Message::Text(t)).await.unwrap();
                        },
                        ClientMessage::Data(id, b) => {
                            println!("socket: server sending '{:?}' to {}", b, id);
                            socket.send(Message::Binary(b)).await.unwrap();
                        },
                        ClientMessage::BroadcastText(t) => {
                            println!("socket: server broadcasting '{:?}' to {}", t, client_id);
                            socket.send(Message::Text(t)).await.unwrap();
                        },
                        ClientMessage::BroadcastData(b) => {
                            println!("socket: server broadcasting '{:?}' to {}", b, client_id);
                            socket.send(Message::Binary(b)).await.unwrap();
                        },
                        _ => {}
                    }
                }
            }
        }
    });
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    _user_agent: Option<TypedHeader<headers::UserAgent>>,
    Extension(state): Extension<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

pub struct WebChannels {
    pub tx: UnboundedSender<ClientMessage>,
    rx: UnboundedReceiver<ClientMessage>,
}

impl WebChannels {
    pub fn send(&self, msg: ClientMessage) {
        let _ = self.tx.send(msg);
    }
    pub async fn recv(&mut self) -> Option<ClientMessage> {
        tokio::macros::support::poll_fn(|cx| self.rx.poll_recv(cx)).await
    }
}

async fn server(port: u16, client_tx: UnboundedSender<ClientMessage>) {
    // Bundle to let the clients create new ids, and get a copy of the tx channel
    // for them to send messages here
    let state = Arc::new(AppState {
        max_id: Mutex::new(0),
        client_tx: client_tx,
    });

    let spa = SpaRouter::new("/assets", "dist");
    let app = Router::new()
        .merge(spa)
        .route("/ws", get(ws_handler))
        .layer(Extension(state.clone()));
    let addr = SocketAddr::from(([0, 0, 0, 0], port));

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

pub async fn start(port: u16) -> WebChannels {
    // Channel for parent to messages to us.
    let (parent_tx, mut parent_rx) = unbounded_channel::<ClientMessage>();

    // Channel for us to send messages to parent
    let (server_tx, server_rx) = unbounded_channel::<ClientMessage>();

    // Channel for clients to send messages to us
    let (client_tx, mut client_rx) = unbounded_channel::<ClientMessage>();

    // (us-to-client channels are created on the fly and the tx passed in via 'Connected')

    // https://docs.rs/axum-extra/latest/axum_extra/routing/struct.SpaRouter.html
    tokio::spawn(server(port, client_tx));

    tokio::spawn(async move {
        let mut clients: HashMap<u32, UnboundedSender<ClientMessage>> = HashMap::new();
        loop {
            tokio::select! {
                Some(msg) = parent_rx.recv() => {
                    match msg {
                        ClientMessage::Text(id, t) => {
                            // println!("web: server sent str: {:?}", t);
                            clients.get(&id).map(|tx| {
                                let _ = tx.send(ClientMessage::Text(id, t));
                            });
                        },
                        ClientMessage::Data(id, b) => {
                            // println!("web: server sent data: {:?}", &b);
                            clients.get(&id).map(|tx| {
                                let _ = tx.send(ClientMessage::Data(id, b));
                            });
                        },
                        ClientMessage::BroadcastText(t) => {
                            // println!("web: server broadcast str: {:?}", t.as_str());
                            // If, for whatever reason, this is slow, we could consider
                            // using a broadcast channel and receiver instead
                            for (_id, tx) in &clients {
                                // println!("web: server broadcasting '{:?}' to {}", t, id);
                                let _ = tx.send(ClientMessage::BroadcastText(t.to_string()));
                            }
                        },
                        ClientMessage::BroadcastData(d) => {
                            // println!("web: server broadcast data: {:?}", &d);
                            // If, for whatever reason, this is slow, we could consider
                            // using a broadcast channel and receiver instead
                            for (_id, tx) in &clients {
                                // println!("web: server broadcasting data to {}", id);
                                let _ = tx.send(ClientMessage::BroadcastData(d.clone()));
                            }
                        },
                        _ => { } // Connected/Disconnected not valid from parent}
                    }
                },
                Some(msg) = client_rx.recv() => {
                    match msg {
                        ClientMessage::Connected(id, tx) => {
                            println!("web: client {} connected", id);
                            clients.insert(id, tx);
                            let _ = server_tx.send(ClientMessage::Clients(clients.len() as u32));
                        },
                        ClientMessage::Disconnected(id) => {
                            println!("web: client {} disconnected", id);
                            clients.remove(&id);
                            let _ = server_tx.send(ClientMessage::Clients(clients.len() as u32));
                        },
                        ClientMessage::Text(id, t) => {
                            println!("web: client {} sent str: {:?}", id, t);
                            let _ = server_tx.send(ClientMessage::Text(id, t));
                        },
                        ClientMessage::Data(id, d) => {
                            println!("web: client {} sent data: {:?}", id, d);
                            let _ = server_tx.send(ClientMessage::Data(id, d));
                        },
                        _ => {
                            println!("web: unknown client event");
                        },
                    }
                }
            }
        }
    });

    WebChannels {
        tx: parent_tx,
        rx: server_rx,
    }
}
