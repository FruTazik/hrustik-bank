const supabaseUrl = 'https://yuhthantfmbsozvwdeuj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1aHRoYW50Zm1ic296dndkZXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDEzODEsImV4cCI6MjA5MjcxNzM4MX0.uzPZ7xL75IoixVJdcaoAwZSkA1WuhpINxWsjE5iBpg4';
const supabase = supabasejs.createClient(supabaseUrl, supabaseKey);

let userEmail = "";

document.addEventListener('DOMContentLoaded', () => {
    // 1. Привязка кнопок
    document.getElementById('btn-continue').onclick = sendCode;
    document.getElementById('btn-google').onclick = loginWithGoogle;
    document.getElementById('btn-verify-otp').onclick = verifyCode;
    document.getElementById('btn-finish-reg').onclick = finishRegistration;

    // 2. Настройка полей OTP (умный переход и удаление)
    const otpFields = document.querySelectorAll('.otp-field');
    otpFields.forEach((f, i) => {
        f.oninput = (e) => {
            f.value = f.value.replace(/\D/g, '');
            if (f.value && i < 5) otpFields[i+1].focus();
        };
        f.onkeydown = (e) => {
            if (e.key === 'Backspace' && !f.value && i > 0) otpFields[i-1].focus();
        };
    });

    // 3. Маска даты
    const birth = document.getElementById('reg-birth');
    birth.oninput = () => {
        let v = birth.value.replace(/\D/g, '');
        if (v.length > 2) v = v.slice(0,2) + '.' + v.slice(2);
        if (v.length > 5) v = v.slice(0,5) + '.' + v.slice(5,10);
        birth.value = v;
    };
});

// СЦЕНАРИЙ: Отправка кода
async function sendCode() {
    userEmail = document.getElementById('email-input').value.trim();
    if (!userEmail.includes('@')) return alert("Введите почту!");

    const { error } = await supabase.auth.signInWithOtp({ email: userEmail });
    if (error) alert(error.message);
    else changeStep('step-otp');
}

// СЦЕНАРИЙ: Вход через Google (тоже через OTP Supabase делает это под капотом)
async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/index.html' }
    });
}

// СЦЕНАРИЙ: Проверка кода и маршрутизация (Новый или Старый)
async function verifyCode() {
    let token = "";
    document.querySelectorAll('.otp-field').forEach(f => token += f.value);

    const { data, error } = await supabase.auth.verifyOTP({
        email: userEmail,
        token: token,
        type: 'email'
    });

    if (error) return alert("Неверный код");

    // Проверяем, есть ли запись в таблице profiles
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', data.user.id)
        .maybeSingle();

    if (profile && profile.full_name) {
        // Юзер есть — в магазин
        window.location.href = 'index.html';
    } else {
        // Юзера нет — на заполнение данных
        changeStep('step-register');
    }
}

// Завершение регистрации (создание профиля)
async function finishRegistration() {
    const name = document.getElementById('reg-name').value;
    const birth = document.getElementById('reg-birth').value;
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('profiles').insert([
        { id: user.id, email: user.email, full_name: name, birthday: birth }
    ]);

    if (error) alert("Ошибка сохранения: " + error.message);
    else window.location.href = 'index.html';
}

function changeStep(id) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}
