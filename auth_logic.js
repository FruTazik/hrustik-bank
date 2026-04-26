// Конфигурация Supabase
const supabaseUrl = 'https://yuhthantfmbsozvwdeuj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1aHRoYW50Zm1ic296dndkZXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDEzODEsImV4cCI6MjA5MjcxNzM4MX0.uzPZ7xL75IoixVJdcaoAwZSkA1WuhpINxWsjE5iBpg4';
const supabase = supabasejs.createClient(supabaseUrl, supabaseKey);

let userEmail = "";

// Ждем полной загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log("Логика авторизации запущена");

    // Обработка кнопки "Продолжить" через прослушиватель (самый надежный способ)
    const continueBtn = document.getElementById('btn-continue');
    if (continueBtn) {
        continueBtn.addEventListener('click', checkEmail);
    }

    // Обработка ввода в OTP (автопереход)
    const otpFields = document.querySelectorAll('.otp-field');
    otpFields.forEach((field, index) => {
        field.addEventListener('input', (e) => {
            if (e.target.value && index < 5) otpFields[index + 1].focus();
        });
    });
});

// 1. Проверка почты
async function checkEmail() {
    const emailInput = document.getElementById('email-input');
    const emailError = document.getElementById('email-error');
    const btn = document.getElementById('btn-continue');
    
    userEmail = emailInput.value.trim();

    // Сброс стилей
    emailInput.classList.remove('invalid');
    emailError.style.display = 'none';

    // Валидация почты
    if (!userEmail || !userEmail.includes('@') || userEmail.length < 5) {
        emailInput.classList.add('invalid');
        emailError.style.display = 'block';
        return;
    }

    btn.innerText = "Проверка...";
    btn.disabled = true;

    try {
        // Ищем пользователя в профилях
        const { data, error } = await supabase
            .from('profiles')
            .select('email')
            .eq('email', userEmail)
            .maybeSingle();

        if (error) throw error;

        if (data) {
            // Пользователь есть -> шлем OTP
            await sendOTP(userEmail);
        } else {
            // Пользователя нет -> показываем регистрацию
            showStep('step-register');
        }
    } catch (err) {
        console.error("Ошибка Supabase:", err.message);
        alert("Ошибка связи с базой данных");
    } finally {
        btn.innerText = "Продолжить";
        btn.disabled = false;
    }
}

// 2. Регистрация
async function startRegistration() {
    const name = document.getElementById('reg-name');
    const birth = document.getElementById('reg-birth');
    const pass = document.getElementById('reg-pass');
    let hasError = false;

    // Сброс ошибок
    [name, birth, pass].forEach(el => el.classList.remove('invalid'));

    if (!name.value.trim()) { name.classList.add('invalid'); hasError = true; }
    
    // Проверка возраста
    const birthDate = new Date(birth.value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (!birth.value || age < 7) { birth.classList.add('invalid'); hasError = true; }

    if (pass.value.length < 6) { pass.classList.add('invalid'); hasError = true; }

    if (hasError) return;

    try {
        const { error } = await supabase.auth.signUp({
            email: userEmail,
            password: pass.value,
            options: { 
                data: { 
                    full_name: name.value, 
                    birthday: birth.value 
                } 
            }
        });

        if (error) throw error;

        document.getElementById('otp-message').innerText = `Код отправлен на ${maskEmail(userEmail)}`;
        showStep('step-otp');
    } catch (err) {
        alert(err.message);
    }
}

// Утилиты
function showStep(id) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

async function sendOTP(email) {
    const { error } = await supabase.auth.signInWithOtp({ email: email });
    if (error) throw error;
    document.getElementById('otp-message').innerText = `Код отправлен на ${maskEmail(email)}`;
    showStep('step-otp');
}

function maskEmail(email) {
    const [name, dom] = email.split('@');
    return name.substring(0, 3) + "***@" + dom;
}

async function verifyOTP() {
    let token = "";
    document.querySelectorAll('.otp-field').forEach(f => token += f.value);
    
    const { error } = await supabase.auth.verifyOTP({
        email: userEmail,
        token: token,
        type: 'signup' 
    });

    if (!error) {
        window.location.href = 'index.html';
    } else {
        alert("Неверный код");
    }
}

async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
}
