# EspChat
A chat application with esp8266 and Websocket protocol.  
## Library Requirements
- [Arduino core for ESP8266 WiFi chip](https://github.com/esp8266/Arduino)  
- [WebSocket Server and Client for Arduino](https://github.com/Links2004/arduinoWebSockets)  
- [ArduinoJson](https://github.com/bblanchon/ArduinoJson)   
## Installation
On espchat.ino file, change the lines shown below:
```
const char* ssid     = "";
const char* password = "";
```
Upload sketch. Then upload data folder with [Arduino ESP8266 filesystem uploader](https://github.com/esp8266/arduino-esp8266fs-plugin). Copy esp8266's IP number from serial monitor and paste it to your browser. 

## How It Works
esp8266 works as a Webserver on port 80 and hosts html, css, and JavaScript files. It also works as a Websocket server on port 81. Application uses JSON for messages and status updates. esp8266 connects to AP (which specified on espchat.ino file) and starts both Webserver and Websocket server. When a client connects, Webserver sends html, css and js files. When a client logins, browser creates a Websocket connection and Websocket server sends an unique id to client. Then server sends newly connected client's id to all clients. When a client disconnects, server sends disconnected client's id to all clients. 
