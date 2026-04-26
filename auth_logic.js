const supabaseUrl = 'https://yuhthantfmbsozvwdeuj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1aHRoYW50Zm1ic296dndkZXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDEzODEsImV4cCI6MjA5MjcxNzM4MX0.uzPZ7xL75IoixVJdcaoAwZSkA1WuhpINxWsjE5iBpg4';
const supabase = supabasejs.createClient(supabaseUrl, supabaseKey);

let userEmail = "";

// 1. Проверка почты (Вход или Регистрация)
async function checkEmail() {
    const emailInput = document.getElementById('email-input');
    const emailValue = emailInput.value.trim();
    const btn = document.getElementById('btn-continue');

    emailInput.classList.remove('invalid');

    if (!emailValue || !emailValue.includes('@')) {
        emailInput.classList.add('invalid');
        return;
    }

    btn.innerText = "Проверка...";
    btn.disabled = true;

    try {
        // Проверяем, есть ли пользователь в нашей таблице profiles
        const { data, error } = await supabase
            .from('profiles')
            .select('email')
            .eq('email', emailValue)
            .maybeSingle();

        userEmail = emailValue;

        if (data) {
            // Если есть -> сразу шлем OTP для входа
            await sendOTP(userEmail);
        } else {
            // Если нет -> идем на шаг регистрации
            showStep('step-register');
        }
    } catch (err) {
        console.error(err);
    } finally {
        btn.innerText = "Продолжить";
        btn.disabled = false;
    }
}

// 2. Логика регистрации
async function startRegistration() {
    const name = document.getElementById('reg-name');
    const birth = document.getElementById('reg-birth');
    const pass = document.getElementById('reg-pass');
    let valid = true;

    // Сброс ошибок
    [name, birth, pass].forEach(i => i.classList.remove('invalid'));

    if (!name.value) { name.classList.add('invalid'); valid = false; }
    
    // Проверка на 7 лет
    const birthDate = new Date(birth.value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (age < 7) { birth.classList.add('invalid'); valid = false; }

    if (pass.value.length < 6) { pass.classList.add('invalid'); valid = false; }

    if (valid) {
        // Регистрируем в Supabase и шлем письмо подтверждения
        const { error } = await supabase.auth.signUp({
            email: userEmail,
            password: pass.value,
            options: { data: { full_name: name.value, birthday: birth.value } }
        });

        if (!error) {
            document.getElementById('otp-message').innerText = `Мы отправили код на почту ${maskEmail(userEmail)}`;
            showStep('step-otp');
        } else {
            alert(error.message);
        }
    }
}

// Показ нужного шага
function showStep(stepId) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(stepId).classList.add('active');
}

// Отправка OTP кода (Magic Link / OTP)
async function sendOTP(email) {
    const { error } = await supabase.auth.signInWithOtp({ email: email });
    if (!error) {
        document.getElementById('otp-message').innerText = `Мы отправили код на почту ${maskEmail(email)}`;
        showStep('step-otp');
    }
}

// Маскировка почты (te****@gmail.com)
function maskEmail(email) {
    const [name, domain] = email.split('@');
    return name.substring(0, 2) + "****" + "@" + domain;
}

// Google Auth
async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
}

// Авто-переход по полям OTP
const otpFields = document.querySelectorAll('.otp-field');
otpFields.forEach((field, index) => {
    field.addEventListener('input', (e) => {
        if (e.target.value && index < 5) otpFields[index + 1].focus();
    });
});

async function verifyOTP() {
    let token = "";
    otpFields.forEach(f => token += f.value);
    
    const { data, error } = await supabase.auth.verifyOTP({
        email: userEmail,
        token: token,
        type: 'signup' // или 'magiclink' в зависимости от настроек
    });

    if (!error) {
        window.location.href = 'index.html';
    } else {
        alert("Неверный код");
    }
}
