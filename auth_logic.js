const supabaseUrl = 'https://yuhthantfmbsozvwdeuj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Твой ключ
const supabase = supabasejs.createClient(supabaseUrl, supabaseKey);

let userEmail = "";

async function checkEmail() {
    const emailInput = document.getElementById('email-input');
    userEmail = emailInput.value.trim();

    if (!userEmail.includes('@')) {
        emailInput.classList.add('invalid');
        return;
    }

    // Проверяем, есть ли такой email в нашей таблице profiles (которую мы создали ранее)
    const { data, error } = await supabase.from('profiles').select('email').eq('email', userEmail).single();

    if (data) {
        // Пользователь есть -> шлем код для входа
        sendOTP(userEmail);
    } else {
        // Пользователя нет -> на регистрацию
        showStep('step-register');
    }
}

function showStep(stepId) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(stepId).classList.add('active');
}

async function sendOTP(email) {
    const { error } = await supabase.auth.signInWithOtp({ email: email });
    if (!error) {
        document.getElementById('otp-message').innerText = `Мы отправили код на почту ${maskEmail(email)}`;
        showStep('step-otp');
    }
}

function maskEmail(email) {
    const [name, domain] = email.split('@');
    return name.substring(0, 3) + "****" + "@" + domain;
}

async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
}

// Логика ввода OTP (перескок по ячейкам)
const otpFields = document.querySelectorAll('.otp-field');
otpFields.forEach((field, index) => {
    field.addEventListener('input', (e) => {
        if (e.target.value && index < 5) otpFields[index + 1].focus();
    });
});
