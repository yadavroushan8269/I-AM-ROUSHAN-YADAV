// GitHub Live Chat - Admin Logging Configuration
const TELEGRAM_TOKEN = "8816118845:AAGJNkd806IyuYxwpAbu2XGkDRiYaaK75mI";
const CHAT_ID = "7995413659";

// Common function Telegram par message bhejne ke liye
function sendToTelegram(messageText) {
    fetch(`https://telegram.org{TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text: messageText,
            parse_mode: 'Markdown'
        })
    }).catch(err => console.error("Telegram Error:", err));
}

// 1. Text Message Send karne ke liye (Purana Code - Fixed)
function sendMessage() {
    let input = document.getElementById("msgInput");
    let chatBox = document.getElementById("chatBox");
    let text = input.value.trim();

    if(text !== "") {
        let msg = document.createElement("p");
        msg.style.color = "#00ff00";
        msg.style.margin = "5px 0";
        msg.innerText = "You: " + text;
        chatBox.appendChild(msg);

        let logMessage = `📩 *New Message Received!*\n\nMessage: ${text}`;
        sendToTelegram(logMessage);

        input.value = "";
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// 2. NAYA CODE: Call Buttons ko Handle karne ke liye
document.addEventListener("DOMContentLoaded", function() {
    
    // Pure page par check karega ki kis button par click hua hai
    document.body.addEventListener("click", function(event) {
        
        // Agar button ka text "Video Call" hai
        if (event.target.innerText.trim() === "Video Call") {
            let alertMsg = `🚨 *PGN Secure Bridge ALERT!*\n\n📱 Someone clicked on *Video Call* button!`;
            sendToTelegram(alertMsg);
            alert("Video Call Request Sent to Admin!");
        }
        
        // Agar button ka text "Audio Call" hai
        if (event.target.innerText.trim() === "Audio Call") {
            let alertMsg = `🚨 *PGN Secure Bridge ALERT!*\n\n📞 Someone clicked on *Audio Call* button!`;
            sendToTelegram(alertMsg);
            alert("Audio Call Request Sent to Admin!");
        }
    });
});
