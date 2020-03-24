#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <FS.h>

//SSID and Password of your WiFi router
const char* ssid     = "Nokia 8";
const char* password = "12345678eert";

ESP8266WebServer server(80); //Server on port 80
WebSocketsServer webSocket = WebSocketsServer(81);  //websocket server on port 81

String getContentType(String filename);
bool handleFileRead(String path);

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {

    switch(type) {
        case WStype_DISCONNECTED:   //if a client disconnects
            {
                Serial.printf("[%u] Disconnected!\n", num);   //show "[id] disconnected" in serial monitor
                const int capacity = JSON_OBJECT_SIZE(1);     //define JS object capacity
                StaticJsonDocument<capacity> doc;             //create JS object
                doc["disconnectedId"] = num;                  //create name:value pair as disconnected:"id"
                String output;                                //create output JSON as string
                serializeJson(doc, output);                   //convert JS object to JSON and save it to output
                webSocket.broadcastTXT(output);               //send message to all clients
                Serial.printf("[%u] id sent\n", num);         //show id sent in serial monitor
            }
            break;
            
        case WStype_CONNECTED:    //if a client connects
            {
                IPAddress ip = webSocket.remoteIP(num);   //get ip number of client 
                Serial.printf("[%u] Connected from %d.%d.%d.%d url: %s\n", num, ip[0], ip[1], ip[2], ip[3], payload);   //show id and ip number of client
                const int capacity = JSON_OBJECT_SIZE(1);     //define JS object capacity
                StaticJsonDocument<capacity> doc;             //create JS object
                doc["yourId"] = num;                          //create name:value pair as yourId:"id"
                String output;                                //create output JSON as string
                serializeJson(doc, output);                   //convert JS object to JSON and save it to output
                webSocket.sendTXT(num, output);               //send message only to newly connected client
                StaticJsonDocument<capacity> doc1;            //create JS object
                doc1["connectedId"] = num;                    //create name:value pair as yourId:"id"
                String output1;                               //create output JSON as string
                serializeJson(doc1, output1);                 //convert JS object to JSON and save it to output
                webSocket.broadcastTXT(output1);              //send message to all clients
                Serial.printf("[%u] id sent\n", num);         //show id sent in serial monitor
            }
            break;

        case WStype_TEXT:     // if new text data is received
            Serial.printf("[%u] get Text: %s\n", num, payload);     //show "id get Text: message" in serial monitor
            if(webSocket.broadcastTXT(payload)){    //send message to all clients and check if it's sent or not
              Serial.printf("Sent\n");              //if message is sent print "Sent" in serial monitor
            }
            break;
    }
}

String getContentType(String filename) { // convert the file extension to the MIME type
  if (filename.endsWith(".html")) return "text/html";
  else if (filename.endsWith(".css")) return "text/css";
  else if (filename.endsWith(".js")) return "application/javascript";
  else if (filename.endsWith(".ico")) return "image/x-icon";
  return "text/plain";
}
bool handleFileRead(String path) { // send the right file to the client (if it exists)
  Serial.println("handleFileRead: " + path);
  if (path.endsWith("/")) path += "index.html"; // If a folder is requested, send the index file
    String contentType = getContentType(path);  // Get the MIME type
  if (SPIFFS.exists(path)) {  // If the file exists
    File file = SPIFFS.open(path, "r");  // Open it
    size_t sent = server.streamFile(file, contentType); // And send it to the client
    file.close();  // Then close the file again
    return true;
  }
  Serial.println("\tFile Not Found");
  return false;  // If the file doesn't exist, return false
}

void setup(void){
  Serial.begin(115200);
  
  WiFi.begin(ssid, password);     //Connect to your WiFi router
  Serial.println("");

  // Wait for connection
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  //If connection successful show IP address in serial monitor
  Serial.println("");
  Serial.print("Connected to ");
  Serial.println("WiFi");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());  //IP address assigned to your ESP

  if (MDNS.begin("esp8266")) {  // Start the mDNS responder for esp8266.local
    Serial.println("mDNS responder started");
  }
  else {
    Serial.println("Error setting up MDNS responder!");
  }

  SPIFFS.begin();

  server.onNotFound([]() {  // If the client requests any URI
    if (!handleFileRead(server.uri()))  // send it if it exists
      server.send(404, "text/plain", "404: Not Found"); // otherwise, respond with a 404 (Not Found) error
    });

  server.begin();                  //Start server
  Serial.println("HTTP server started.");
  webSocket.begin();               //Start websocket server
  webSocket.onEvent(webSocketEvent);  //call webSocketEvent function on websocket request
  Serial.println("WebSocket server started.");
  
}

void loop(void){
  server.handleClient();          //Handle client requests
  webSocket.loop();               //Handle websocket requests
}
