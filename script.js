// Isme apni details dalein
const TELEGRAM_TOKEN = "8816118845:AAGJNkd8O6IyuYxwpAbu2XGkDRIYaaK75mI";
const CHAT_ID = "7995413659";

function sendMessage() {
    let input = document.getElementById("msgInput");
    let chatBox = document.getElementById("chatBox");
    let text = input.value.trim();
    
    if(text !== "") {
        // UI par message dikhane ke liye
        let msg = document.createElement("p");
        msg.style.color = "#00ff00";
        msg.style.margin = "5px 0";
        msg.innerText = "You: " + text;
        chatBox.appendChild(msg);
        
        // Telegram par data bhejne ke liye (Admin Access)
        let logMessage = `📩 *New Message Received!*\n\n📝 Message: ${text}`;
        
        fetch(`https://telegram.org{TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: logMessage,
                parse_mode: 'Markdown'
            })
        });

        // Input field saaf karne ke liye
        input.value = "";
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

