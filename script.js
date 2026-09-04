let display = document.getElementById('display');
let statusText = document.getElementById('status');
let callBtn = document.getElementById('callBtn');
let isCalling = false;

// Number dial karne ke liye function
function pressKey(num) {
    if (isCalling) return; // Call chalne ke dauran dial block rahega
    if (display.innerText.length < 15) {
        display.innerText += num;
    }
}

// Number saaf karne ke liye function
function clearDisplay() {
    if (isCalling) return;
    display.innerText = display.innerText.slice(0, -1);
}

// Call button functionality
function toggleCall() {
    if (display.innerText === "") {
        statusText.innerText = "Please enter a number";
        statusText.style.color = "#ef4444";
        return;
    }

    if (!isCalling) {
        // Call Connect ho rhi hai
        isCalling = true;
        statusText.innerText = "Calling...";
        statusText.style.color = "#38bdf8";
        callBtn.innerText = "🛑 End Call";
        callBtn.classList.add('calling');
        
        // 2 second baad sound/status simulate karne ke liye
        setTimeout(() => {
            if (isCalling) {
                statusText.innerText = "Connected";
                statusText.style.color = "#10b981";
            }
        }, 2000);
    } else {
        // Call Cut ho rhi hai
        isCalling = false;
        statusText.innerText = "Call Ended";
        statusText.style.color = "#f43f5e";
        callBtn.innerText = "📞 Call";
        callBtn.classList.remove('calling');
        
        setTimeout(() => {
            if (!isCalling) {
                statusText.innerText = "Ready";
                statusText.style.color = "#10b981";
            }
        }, 1500);
    }
}
