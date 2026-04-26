// Используем var, чтобы избежать ошибок повторного объявления (SyntaxError)
var supabaseUrl = 'https://yuhthantfmbsozvwdeuj.supabase.co';
var supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1aHRoYW50Zm1ic296dndkZXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDEzODEsImV4cCI6MjA5MjcxNzM4MX0.uzPZ7xL75IoixVJdcaoAwZSkA1WuhpINxWsjE5iBpg4';

// Проверка: какая версия библиотеки доступна в глобальном окне
var client = window.supabasejs || window.supabase;
var supabase = client.createClient(supabaseUrl, supabaseKey);

var userEmail = "";

// Привязываем кнопки сразу после загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log("HRUSTIK AUTH: Инициализация...");

    // Привязка кнопки продолжить
    var btnCont = document.getElementById('btn-continue');
    if (btnCont) btnCont.onclick = checkUserEmail;

    // Привязка кнопки Google
    var btnGoog = document.getElementById('btn-google');
    if (btnGoog) btnGoog.onclick = signInWithGoogle;

    // Привязка регистрации
    var btnReg = document.getElementById('btn-register-submit');
    if (btnReg) btnReg.onclick = processRegistration;

    // Привязка OTP
    var btnOTP = document.getElementById('btn-verify-otp');
    if (btnOTP) btnOTP.onclick = processVerifyOTP;
});

async function checkUserEmail() {
    var emailInput = document.getElementById('email-input');
    userEmail = emailInput.value.trim();

    if (!userEmail.includes('@')) {
        document.getElementById('email-error').style.display = 'block';
        return;
    }

    try {
        // Проверяем, есть ли такой профиль в таблице profiles
        var { data } = await supabase.from('profiles').select('email').eq('email', userEmail).maybeSingle();

        if (data) {
            // Пользователь найден — отправляем OTP для входа
            await supabase.auth.signInWithOtp({ email: userEmail });
            document.getElementById('otp-message').innerText = "Код отправлен на " + userEmail;
            changeStep('step-otp');
        } else {
            // Пользователя нет — отправляем на регистрацию
            changeStep('step-register');
        }
    } catch (e) {
        alert("Ошибка: " + e.message);
    }
}

async function processRegistration() {
    var name = document.getElementById('reg-name').value;
    var pass = document.getElementById('reg-pass').value;
    var birth = document.getElementById('reg-birth').value;

    var { error } = await supabase.auth.signUp({
        email: userEmail,
        password: pass,
        options: { data: { full_name: name, birthday: birth } }
    });

    if (error) alert(error.message);
    else changeStep('step-otp');
}

async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
            queryParams: { prompt: 'select_account' },
            redirectTo: window.location.origin + window.location.pathname.replace('auth.html', 'index.html')
        }
    });
}

async function processVerifyOTP() {
    var token = "";
    document.querySelectorAll('.otp-field').forEach(f => token += f.value);
    
    var { error } = await supabase.auth.verifyOTP({
        email: userEmail,
        token: token,
        type: 'email'
    });

    if (error) alert("Неверный код");
    else window.location.href = 'index.html';
}

function changeStep(id) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}
