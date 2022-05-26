# RSBios
 
Rust library to read and parse DCS-BIOS messages and output them on an unbounded channel

## Usage
```
let (tx, mut rx) = rsbios::start().await?;

while let Some(msg) = rx.recv().await {
    let rsbios::DCSMessage::Data(addr, data) = msg;
    println!("{:?}", addr);
    println!("{:?}", data);
}
```