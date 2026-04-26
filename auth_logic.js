// Используем var, чтобы не было ошибки "Identifier has already been declared"
var supabaseUrl = 'https://yuhthantfmbsozvwdeuj.supabase.co';
var supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1aHRoYW50Zm1ic296dndkZXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDEzODEsImV4cCI6MjA5MjcxNzM4MX0.uzPZ7xL75IoixVJdcaoAwZSkA1WuhpINxWsjE5iBpg4';
var supabase = supabasejs.createClient(supabaseUrl, supabaseKey);

var userEmail = "";

// Главная функция, которая оживляет всё
document.addEventListener('DOMContentLoaded', function() {
    console.log("HRUSTIK: Система авторизации готова");

    // 1. Кнопка "Продолжить" (Шаг 1)
    var btnContinue = document.getElementById('btn-continue');
    if (btnContinue) {
        btnContinue.addEventListener('click', function() {
            checkUserEmail();
        });
    }

    // 2. Кнопка "Создать аккаунт" (Шаг 2)
    var btnRegister = document.getElementById('btn-register-submit');
    if (btnRegister) {
        btnRegister.addEventListener('click', function() {
            processRegistration();
        });
    }

    // 3. Кнопка "Войти" через OTP (Шаг 3)
    var btnVerify = document.getElementById('btn-verify-otp');
    if (btnVerify) {
        btnVerify.addEventListener('click', function() {
            processVerifyOTP();
        });
    }

    // 4. Кнопка Google
    var btnGoogle = document.getElementById('btn-google');
    if (btnGoogle) {
        btnGoogle.addEventListener('click', function() {
            signInWithGoogle();
        });
    }

    // 5. Автопереход в полях OTP
    var otpFields = document.querySelectorAll('.otp-field');
    otpFields.forEach(function(field, index) {
        field.addEventListener('input', function(e) {
            if (e.target.value && index < 5) otpFields[index + 1].focus();
        });
    });
});

// --- ЛОГИКА ФУНКЦИЙ ---

async function checkUserEmail() {
    var emailInput = document.getElementById('email-input');
    var emailError = document.getElementById('email-error');
    var btn = document.getElementById('btn-continue');
    
    userEmail = emailInput.value.trim();
    emailInput.classList.remove('invalid');
    emailError.style.display = 'none';

    if (!userEmail || !userEmail.includes('@')) {
        emailInput.classList.add('invalid');
        emailError.style.display = 'block';
        return;
    }

    btn.innerText = "Минутку...";
    btn.disabled = true;

    try {
        var { data, error } = await supabase
            .from('profiles')
            .select('email')
            .eq('email', userEmail)
            .maybeSingle();

        if (error) throw error;

        if (data) {
            // Юзер есть -> шлем код
            sendLoginOTP(userEmail);
        } else {
            // Юзера нет -> на регистрацию
            changeStep('step-register');
        }
    } catch (err) {
        console.error(err);
        alert("Ошибка связи с базой");
    } finally {
        btn.innerText = "Продолжить";
        btn.disabled = false;
    }
}

async function processRegistration() {
    var name = document.getElementById('reg-name');
    var birth = document.getElementById('reg-birth');
    var pass = document.getElementById('reg-pass');
    var hasError = false;

    [name, birth, pass].forEach(function(el) { el.classList.remove('invalid'); });

    if (!name.value.trim()) { name.classList.add('invalid'); hasError = true; }
    if (!birth.value) { birth.classList.add('invalid'); hasError = true; }
    if (pass.value.length < 6) { pass.classList.add('invalid'); hasError = true; }

    if (hasError) return;

    try {
        var { error } = await supabase.auth.signUp({
            email: userEmail,
            password: pass.value,
            options: { data: { full_name: name.value, birthday: birth.value } }
        });

        if (error) throw error;
        document.getElementById('otp-message').innerText = "Код отправлен на " + userEmail;
        changeStep('step-otp');
    } catch (err) {
        alert(err.message);
    }
}

async function sendLoginOTP(email) {
    var { error } = await supabase.auth.signInWithOtp({ email: email });
    if (error) {
        alert(error.message);
    } else {
        document.getElementById('otp-message').innerText = "Код для входа отправлен на " + email;
        changeStep('step-otp');
    }
}

async function processVerifyOTP() {
    var token = "";
    document.querySelectorAll('.otp-field').forEach(function(f) { token += f.value; });
    
    var { error } = await supabase.auth.verifyOTP({
        email: userEmail,
        token: token,
        type: 'email' 
    });

    if (!error) {
        window.location.href = 'index.html';
    } else {
        alert("Код неверный или просрочен");
    }
}

async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + window.location.pathname.replace('auth.html', 'index.html')
        }
    });
}

function changeStep(id) {
    document.querySelectorAll('.step').forEach(function(s) { s.classList.remove('active'); });
    document.getElementById(id).classList.add('active');
}
