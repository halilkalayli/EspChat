let messages = {};
let name = "";
let messageCounter = 0;
let connection;
let myId = 0;
let status = 0;
let message = "";
let date = "";
let newConnection;
//create standard message for communicating other clients. myId is given by esp8266 on connection. 
//name is the name entered on login screen. message is text typed on chat window. date is current time:minute.
//status = 0 means its a normal chat message.
//status = 1 is sent to clients on first connection. it is also sent on another clients first connection to say "hi! i'm online too".
function createMessage(myId, name, message, date, status) 
{
    this.myId = myId;
    this.name = name;
    this.message = message;
    this.date = date;
    this.status = status;
}
document.getElementById("enter").addEventListener("click", enterbuttonClicked);
function enterbuttonClicked() {
    login();
}
document.getElementById("name").addEventListener("keydown", function(event){
    if (event.key === "Enter") {
        login();
    }
})
document.getElementById("exit").addEventListener("click", exitButtonClicked);
function exitButtonClicked(){    
    connection.close();    
}
document.getElementById("send").addEventListener("click", sendButtonClicked);
function sendButtonClicked() {
    sendMessage();
}
document.getElementById("msg").addEventListener("keydown", function(event){
    if (event.key === "Enter") {
        sendMessage();
    }
})
let x = window.matchMedia("(min-width: 1000px)");   //for smaller screens. like css @media option.
function myFunction(x) {
    if (x.matches) { 
        document.getElementById("container1").className = "container";
    } 
    else {
        document.getElementById("container1").className = "mobile-container";
    }
}
function webSocketConnection () {
    connection = new WebSocket("ws:" + location.hostname + ":81/", ['arduino']);
    connection.onerror = function (error) {
        console.log('WebSocket Error ', error);
    };
    connection.onclose = function () {
        x.removeListener(myFunction);   //cancel listener for style change
        document.getElementById("container1").className = "hidden";     //hide chat window
        document.getElementById("loginform").style.display = "flex";    //show login window back
        removeChatMessages();
        let onlineUsers = document.getElementById("online");
        onlineUsers.innerHTML = "";     //delete online users list
        console.log('WebSocket connection closed');
    };
    connection.onmessage = function(event) { processReceivedCommand(event); };
        function processReceivedCommand(evt) {
            let msg = JSON.parse(evt.data);     //convert JSON to js object
            if(msg.yourId !== undefined){       //esp8266 sends an id number as yourId only to newly connected client
                myId = msg.yourId;              
                status = 1;                     //tell other clients that i'm online
                let onlineMessage = new createMessage(myId, name, message, date, status);
                let msgJSON = JSON.stringify(onlineMessage);    //convert js object to JSON
                connection.send(msgJSON);
            }
            else if(msg.disconnectedId !== undefined){      //esp8266 sends disconnected clients id as disconnectedId
                let today = new Date();
                let hour = today.getHours();
                let minute = today.getMinutes();
                if(minute < 10) {
                    minute = "0" + minute;
                }
                date = hour + ":" + minute;
                let userIdName = "user" + msg.disconnectedId;       
                let username = document.getElementById(userIdName).innerHTML;
                document.getElementById(userIdName).remove();
                let node = document.createElement("div");
                node.className = "rightaligned";
                let textnode = document.createTextNode(username + " disconnected");
                node.appendChild(textnode);
                let node1 = document.createElement("div");
                node1.className = "timestamp";
                let textnode1 = document.createTextNode(date);
                node1.appendChild(textnode1);
                node.appendChild(node1);
                document.getElementById("chatbox").appendChild(node);
                document.getElementById("chatbox").scrollTop += 500;
                messages["log" + messageCounter] = msg;
                messageCounter++;
            }
            else if(msg.connectedId !== undefined){     //esp8266 broadcasts newly connected id as connectedId to all clients
                if(msg.connectedId != myId){            //this id comes to newly connected client too. check if newly connected client is this client
                    newConnection = msg.connectedId;
                    status = 1;
                    let sendStatus = new createMessage(myId, name, message, date, status);      //say "hi i'm online too" to newly connected client 
                    let msgJSON = JSON.stringify(sendStatus);
                    connection.send(msgJSON);
                }                        
            }
            else if(msg.status == 1) {      //if a "hi i'm online" message comes
                let userIdName = "user" + msg.myId;     //give it an userId as user0, user1...
                let currentOnline = document.getElementById(userIdName);    //look for new user in online users list 
                if(currentOnline == null) {     //if it's not in list
                    let online = document.createElement("li");      //create a new list element
                    online.id = userIdName;     //assign userId as new li elements id
                    let onlinenode = document.createTextNode(msg.name);     //append users name as text to li
                    online.appendChild(onlinenode);
                    document.getElementById("online").appendChild(online);  //append li element to online users ul element
                    if(msg.myId == newConnection) {     //if status = 1 message comes from newly connected client 
                        newConnection = -1;             //reset newConnection variable
                        let today = new Date();         //show "user connected" message on chatbox
                        let hour = today.getHours();
                        let minute = today.getMinutes();
                        if(minute < 10) {
                            minute = "0" + minute;
                        }
                        date = hour + ":" + minute;
                        let node = document.createElement("div");
                        node.className = "rightaligned";
                        let textnode = document.createTextNode(msg.name + " connected");
                        node.appendChild(textnode);
                        let node1 = document.createElement("div");
                        node1.className = "timestamp";
                        let textnode1 = document.createTextNode(date);
                        node1.appendChild(textnode1);
                        node.appendChild(node1);
                        document.getElementById("chatbox").appendChild(node);
                        document.getElementById("chatbox").scrollTop += 500;
                        messages["log" + messageCounter] = msg;
                        messageCounter++;
                    }
                }
            }
            else {      //if a normal chat message comes show it on chatbox
                let node = document.createElement("div");       //messages shown in div's
                    if(myId == msg.myId) {          //if message is your own message
                        node.className = "rightaligned";    //show it on the right side of chatbox
                    }
                    else {                          //if message comes from another client
                        node.className = "leftaligned";     //show it on he left side of chatbox
                    }
                let textnode = document.createTextNode(msg.message);
                node.appendChild(textnode);
                let node1 = document.createElement("div");
                node1.className = "timestamp";
                let textnode1 = document.createTextNode(msg.date);
                node1.appendChild(textnode1);
                node.appendChild(node1);
                document.getElementById("chatbox").appendChild(node);
                document.getElementById("chatbox").scrollTop += 500;
                messages["log" + messageCounter] = msg;
                messageCounter++;
            }
    };
}
function login(){
    let text = document.getElementById("name").value;
    text = text.replace(/^\s+/,'').replace(/\s+$/, '');     //check if login name begins with white space(s). if it has white space as first character(s) remove them
    if(text !== "") {   //check if login name is not empty
        name = text;
        webSocketConnection();      //start websocket
        document.getElementById("loginform").style.display = "none";    //hide login window
        document.getElementById("container1").className = "container";      //show chatbox window
        document.getElementById("welcome").innerHTML = "Welcome, " + text;      //create welcome message on the top left side
        document.getElementById("name").value = "";     //delete name from the login window
        myFunction(x);      //add listener for style change function and call it for the first time
        x.addListener(myFunction);
    }
}
function removeChatMessages() {
    let chatMessages = document.getElementsByClassName("leftaligned");
    let chatMessagesLength = chatMessages.length;
    for(let i=0; i < chatMessagesLength; i++){
        chatMessages[0].remove();
    }
    chatMessages = document.getElementsByClassName("rightaligned");
    chatMessagesLength = chatMessages.length;
    for(let i=0; i < chatMessagesLength; i++){
        chatMessages[0].remove();
    }
}
function sendMessage() {
    let text = document.getElementById("msg").value;
    let text1 = text.replace(/^\s+/,'').replace(/\s+$/, '');    //check if message begins with white space(s). if it has white space as first character(s) remove them
    let a = document.getElementById("chatbox");                 
    if(text1 !== "") {      //check if message is empty
        let today = new Date();     //get date 
        let hour = today.getHours();
        let minute = today.getMinutes();
        if(minute < 10) {   //minutes returns without a zero like "1, 2, ... ,10"
            minute = "0" + minute;     //add zero to the minutes less than 10
        }
        status = 0;
        date = hour + ":" + minute;     //hh : mm format
        let msg = new createMessage(myId, name, text, date, status);    //create message object
        messages["log" + messageCounter] = msg;     //add message to log
        document.getElementById("msg").value = "";      //delete message from input
        a.scrollTop += 500;     //scroll chatbox to to last message
        let msgJSON = JSON.stringify(msg);      //convert js object to JSON
        connection.send(msgJSON);       //send message to esp8266
        messageCounter++;       //increase message counter
    }
}
