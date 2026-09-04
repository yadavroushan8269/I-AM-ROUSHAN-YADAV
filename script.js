function sendMessage() {
    let input = document.getElementById("msgInput");
    let chatBox = document.getElementById("chatBox");
    
    if(input.value.trim() !== "") {
        let msg = document.createElement("p");
        msg.style.color = "#00ff00";
        msg.style.margin = "5px 0";
        msg.innerText = "You: " + input.value;
        chatBox.appendChild(msg);
        
        // Clear input field
        input.value = "";
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}
