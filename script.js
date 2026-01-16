// Animated Background Canvas
const canvas = document.getElementById('backgroundCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.2;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
    }

    draw() {
        ctx.fillStyle = `rgba(102, 126, 234, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

const particles = [];
for (let i = 0; i < 80; i++) {
    particles.push(new Particle());
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let particle of particles) {
        particle.update();
        particle.draw();
    }
    
    // Draw connections
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                ctx.strokeStyle = `rgba(102, 126, 234, ${0.2 * (1 - distance / 100)})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
    
    requestAnimationFrame(animateParticles);
}

animateParticles();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Main Application
const welcomeScreen = document.getElementById('welcomeScreen');
const messagesContainer = document.getElementById('messages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typing');
const chatContainer = document.getElementById('chatContainer');
const clearBtn = document.getElementById('clearBtn');
const themeBtn = document.getElementById('themeBtn');
const charCount = document.getElementById('charCount');
const totalCalculations = document.getElementById('totalCalculations');

let calculationCount = 0;
let isDark = true;

// Theme Toggle
themeBtn.addEventListener('click', () => {
    isDark = !isDark;
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
});

// Character Counter
userInput.addEventListener('input', () => {
    charCount.textContent = userInput.value.length;
    userInput.style.height = 'auto';
    userInput.style.height = userInput.scrollHeight + 'px';
});

// Tool Buttons
document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const symbol = btn.getAttribute('data-insert');
        const start = userInput.selectionStart;
        const end = userInput.selectionEnd;
        const text = userInput.value;
        userInput.value = text.substring(0, start) + symbol + text.substring(end);
        userInput.focus();
        userInput.selectionStart = userInput.selectionEnd = start + symbol.length;
        charCount.textContent = userInput.value.length;
    });
});

// Send Message
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Hide welcome screen
    if (welcomeScreen.style.display !== 'none') {
        welcomeScreen.style.display = 'none';
    }

    // Add user message
    addMessage(message, 'user');
    userInput.value = '';
    charCount.textContent = '0';
    userInput.style.height = 'auto';

    // Show typing
    typingIndicator.style.display = 'flex';
    scrollToBottom();

    // Process message
    await new Promise(resolve => setTimeout(resolve, 500));
    const response = await processMessage(message);

    // Hide typing
    typingIndicator.style.display = 'none';

    // Add AI response
    addMessage(response, 'ai');

    // Update stats
    calculationCount++;
    totalCalculations.textContent = calculationCount;
}

async function processMessage(message) {
    const lowerMsg = message.toLowerCase().trim();

    // İNTEGRAL
    if (lowerMsg.includes('integral') || lowerMsg.includes('∫')) {
        return handleIntegral(message);
    }

    // TÜREV
    if (lowerMsg.includes('türev') || lowerMsg.includes('derivative') || lowerMsg.includes('d/dx')) {
        return handleDerivative(message);
    }

    // LİMİT
    if (lowerMsg.includes('limit') || lowerMsg.includes('lim')) {
        return handleLimit(message);
    }

    // DENKLEM ÇÖZME
    if (lowerMsg.includes('çöz') || lowerMsg.includes('solve') || lowerMsg.includes('=')) {
        return handleEquation(message);
    }

    // SADELEŞTİRME
    if (lowerMsg.includes('sadeleştir') || lowerMsg.includes('simplify')) {
        return handleSimplify(message);
    }

    // ÇARPANLARA AYIRMA
    if (lowerMsg.includes('çarpanlar') || lowerMsg.includes('factor')) {
        return handleFactor(message);
    }

    // AÇILIM
    if (lowerMsg.includes('açılım') || lowerMsg.includes('expand')) {
        return handleExpand(message);
    }

    // Genel yanıt
    return `Merhaba! Ben **NeuralMath AI**, gerçek matematik motoru ile çalışan yapay zekayım. 

🧮 **Yapabileceklerim:**
- ∫ İntegral hesaplama
- d/dx Türev alma
- lim Limit hesaplama
- = Denklem çözme
- Sadeleştirme
- Çarpanlara ayırma

**Örnek komutlar:**
- "integral x^2 dx"
- "türev sin(x)*x^3"
- "limit sin(x)/x x->0"
- "çöz x^2 - 5*x + 6 = 0"
- "sadeleştir (x^2-4)/(x-2)"

Bir problem söyleyin, çözelim! 🚀`;
}

function handleIntegral(message) {
    // Extract expression
    let expr = extractExpression(message, ['integral', '∫']);
    expr = expr.replace(/dx|d\s*x/gi, '').trim();

    if (!expr) {
        return '❌ Lütfen bir ifade girin. Örnek: **integral x^2 dx**';
    }

    const result = mathEngine.integral(expr, 'x');

    if (result.error) {
        return `❌ Hata: ${result.error}\n\nLütfen ifadeyi kontrol edin.`;
    }

    return formatMathResponse('İntegral Çözümü', expr, result, '∫');
}

function handleDerivative(message) {
    let expr = extractExpression(message, ['türev', 'derivative', 'd/dx']);

    if (!expr) {
        return '❌ Lütfen bir ifade girin. Örnek: **türev x^3**';
    }

    const result = mathEngine.derivative(expr, 'x');

    if (result.error) {
        return `❌ Hata: ${result.error}`;
    }

    return formatMathResponse('Türev Hesaplama', expr, result, 'd/dx');
}

function handleLimit(message) {
    // Extract limit expression
    const match = message.match(/limit\s+(.+?)\s+(?:x->|x→)(\S+)/i) || 
                  message.match(/lim[^(]*\(([^)]+)\).*?(?:x->|x→)(\S+)/i);

    if (!match) {
        return '❌ Format: **limit (sin(x)/x) x->0**';
    }

    const expr = match[1].trim();
    const approach = match[2].trim();

    const result = mathEngine.limit(expr, 'x', approach);

    if (result.error) {
        return `❌ Hata: ${result.error}`;
    }

    return formatMathResponse('Limit Hesaplama', `lim(x→${approach}) ${expr}`, result, 'lim');
}

function handleEquation(message) {
    // Extract equation
    const eqMatch = message.match(/[x\d\s\+\-\*\^()]+=[^=]+/);
    
    if (!eqMatch) {
        return '❌ Lütfen geçerli bir denklem girin. Örnek: **x^2 - 5*x + 6 = 0**';
    }

    const equation = eqMatch[0].trim();
    const result = mathEngine.solveEquation(equation, 'x');

    if (result.error) {
        return `❌ Hata: ${result.error}`;
    }

    return formatMathResponse('Denklem Çözümü', equation, result, '=');
}

function handleSimplify(message) {
    let expr = extractExpression(message, ['sadeleştir', 'simplify']);

    if (!expr) {
        return '❌ Lütfen bir ifade girin.';
    }

    const result = mathEngine.simplify(expr);

    if (result.error) {
        return `❌ Hata: ${result.error}`;
    }

    return formatMathResponse('Sadeleştirme', expr, result, '≈');
}

function handleFactor(message) {
    let expr = extractExpression(message, ['çarpanlar', 'factor']);

    if (!expr) {
        return '❌ Lütfen bir ifade girin.';
    }

    const result = mathEngine.factor(expr);

    if (result.error) {
        return `❌ Hata: ${result.error}`;
    }

    return formatMathResponse('Çarpanlara Ayırma', expr, result, '×');
}

function handleExpand(message) {
    let expr = extractExpression(message, ['açılım', 'expand']);

    if (!expr) {
        return '❌ Lütfen bir ifade girin.';
    }

    const result = mathEngine.expand(expr);

    if (result.error) {
        return `❌ Hata: ${result.error}`;
    }

    return formatMathResponse('Açılım', expr, result, '+');
}

function extractExpression(message, keywords) {
    let expr = message;
    
    for (let keyword of keywords) {
        const idx = expr.toLowerCase().indexOf(keyword.toLowerCase());
        if (idx !== -1) {
            expr = expr.substring(idx + keyword.length).trim();
            break;
        }
    }
    
    return expr;
}

function formatMathResponse(title, original, result, icon) {
    let html = `<div class="solution-box">`;
    html += `<h4>${icon} ${title}</h4>`;
    html += `<p><strong>Soru:</strong> \\(${original}\\)</p>`;
    
    if (result.result) {
        html += `<p><strong>✅ Sonuç:</strong> \\(${result.result}\\)</p>`;
    }
    
    if (result.steps && result.steps.length > 0) {
        html += `<div class="steps"><strong>📝 Adımlar:</strong>`;
        for (let step of result.steps) {
            html += `<div class="step">${step}</div>`;
        }
        html += `</div>`;
    }
    
    html += `</div>`;
    
    return html;
}

function addMessage(content, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = type === 'user' ? '👤' : '🤖';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);

    // Render LaTeX
    if (window.MathJax) {
        MathJax.typesetPromise([contentDiv]).catch((err) => console.log(err));
    }

    scrollToBottom();
}

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Event Listeners
sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

clearBtn.addEventListener('click', () => {
    messagesContainer.innerHTML = '';
    welcomeScreen.style.display = 'flex';
    calculationCount = 0;
    totalCalculations.textContent = '0';
});

// Capability buttons
document.querySelectorAll('.capability-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.capability-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Example chips
document.querySelectorAll('.example-chip, .quick-ex').forEach(chip => {
    chip.addEventListener('click', () => {
        const example = chip.getAttribute('data-example') || chip.textContent;
        userInput.value = example;
        charCount.textContent = example.length;
        sendMessage();
    });
});

console.log('%c🚀 NeuralMath AI Hazır!', 'color: #667eea; font-size: 20px; font-weight: bold;');
console.log('%cGerçek matematik motoru aktif.', 'color: #764ba2; font-size: 14px;');
