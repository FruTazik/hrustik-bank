// Инициализация Supabase
const supabaseUrl = 'https://yuhthantfmbsozvwdeuj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1aHRoYW50Zm1ic296dndkZXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDEzODEsImV4cCI6MjA5MjcxNzM4MX0.uzPZ7xL75IoixVJdcaoAwZSkA1WuhpINxWsjE5iBpg4';
const client = window.supabasejs || window.supabase;
const supabase = client.createClient(supabaseUrl, supabaseKey);

let userEmail = "";

document.addEventListener('DOMContentLoaded', () => {
    console.log("Скрипт запущен, кнопки привязываются...");

    // Привязка кнопки отправки почты
    const btnContinue = document.getElementById('btn-continue');
    if (btnContinue) btnContinue.onclick = sendCode;

    // Привязка кнопки подтверждения кода
    const btnVerify = document.getElementById('btn-verify-otp');
    if (btnVerify) btnVerify.onclick = verifyCode;

    // Привязка кнопки завершения регистрации
    const btnFinish = document.getElementById('btn-finish-reg');
    if (btnFinish) btnFinish.onclick = finishRegistration;

    // Привязка Google
    const btnGoogle = document.getElementById('btn-google');
    if (btnGoogle) btnGoogle.onclick = loginWithGoogle;

    // Логика полей OTP
    const otpFields = document.querySelectorAll('.otp-field');
    otpFields.forEach((f, i) => {
        f.oninput = (e) => {
            f.value = f.value.replace(/\D/g, ''); // Только цифры
            if (f.value && i < 5) otpFields[i+1].focus();
        };
        f.onkeydown = (e) => {
            if (e.key === 'Backspace' && !f.value && i > 0) otpFields[i-1].focus();
        };
    });

    // Маска для даты
    const birth = document.getElementById('reg-birth');
    if (birth) {
        birth.oninput = () => {
            let v = birth.value.replace(/\D/g, '');
            if (v.length > 2) v = v.slice(0,2) + '.' + v.slice(2);
            if (v.length > 5) v = v.slice(0,5) + '.' + v.slice(5,10);
            birth.value = v;
        };
    }
});

// 1. Отправка OTP кода
async function sendCode() {
    console.log("Нажата отправка кода");
    userEmail = document.getElementById('email-input').value.trim();
    if (!userEmail.includes('@')) {
        document.getElementById('email-error').style.display = 'block';
        return;
    }

    const { error } = await supabase.auth.signInWithOtp({ email: userEmail });
    if (error) {
        alert("Ошибка: " + error.message);
    } else {
        console.log("Код отправлен успешно");
        changeStep('step-otp');
    }
}

// 2. Проверка кода
async function verifyCode() {
    console.log("Нажато подтверждение кода");
    let token = "";
    document.querySelectorAll('.otp-field').forEach(f => token += f.value);

    if (token.length < 6) {
        alert("Введите все 6 цифр кода");
        return;
    }

    const { data, error } = await supabase.auth.verifyOTP({
        email: userEmail,
        token: token,
        type: 'email'
    });

    if (error) {
        alert("Неверный или просроченный код");
        return;
    }

    console.log("Код верный, проверяем профиль юзера...");
    
    // Проверка: новый это юзер или старый
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', data.user.id)
        .maybeSingle();

    if (profile && profile.full_name) {
        console.log("Юзер найден, вход...");
        window.location.href = 'index.html';
    } else {
        console.log("Новый юзер, переход к анкете");
        changeStep('step-register');
    }
}

// 3. Сохранение данных профиля
async function finishRegistration() {
    console.log("Завершение регистрации...");
    const name = document.getElementById('reg-name').value.trim();
    const birth = document.getElementById('reg-birth').value.trim();

    if (!name || birth.length < 10) {
        alert("Заполните все поля корректно");
        return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('profiles').insert([
        { id: user.id, email: user.email, full_name: name, birthday: birth }
    ]);

    if (error) {
        alert("Ошибка базы данных: " + error.message);
    } else {
        window.location.href = 'index.html';
    }
}

async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/index.html' }
    });
}

function changeStep(id) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}
