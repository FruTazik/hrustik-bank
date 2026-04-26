// ПРОВЕРКА ЗАГРУЗКИ: Как только обновишь страницу, должен выскочить алерт.
// Если его нет — значит файл auth_logic.js не найден или путь к нему неверный!
console.log("СКРИПТ ЗАГРУЖЕН");

var supabaseUrl = 'https://yuhthantfmbsozvwdeuj.supabase.co';
var supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1aHRoYW50Zm1ic296dndkZXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDEzODEsImV4cCI6MjA5MjcxNzM4MX0.uzPZ7xL75IoixVJdcaoAwZSkA1WuhpINxWsjE5iBpg4';
var supabase = supabasejs.createClient(supabaseUrl, supabaseKey);

var userEmail = "";

// Функция для переключения шагов
function changeStep(id) {
    document.querySelectorAll('.step').forEach(function(s) { s.classList.remove('active'); });
    document.getElementById(id).classList.add('active');
}

// 1. ПРОВЕРКА ПОЧТЫ
async function checkUserEmail() {
    console.log("Нажата кнопка Продолжить");
    var emailInput = document.getElementById('email-input');
    var emailError = document.getElementById('email-error');
    
    userEmail = emailInput.value.trim();
    
    if (!userEmail || !userEmail.includes('@')) {
        emailInput.classList.add('invalid');
        emailError.style.display = 'block';
        return;
    }

    try {
        var { data, error } = await supabase
            .from('profiles')
            .select('email')
            .eq('email', userEmail)
            .maybeSingle();

        if (data) {
            // Шлем код для входа
            await supabase.auth.signInWithOtp({ email: userEmail });
            document.getElementById('otp-message').innerText = "Код для входа отправлен на " + userEmail;
            changeStep('step-otp');
        } else {
            // Ведем на регистрацию
            changeStep('step-register');
        }
    } catch (e) {
        alert("Ошибка базы: " + e.message);
    }
}

// 2. РЕГИСТРАЦИЯ
async function processRegistration() {
    var name = document.getElementById('reg-name').value;
    var pass = document.getElementById('reg-pass').value;
    var birth = document.getElementById('reg-birth').value;

    try {
        var { error } = await supabase.auth.signUp({
            email: userEmail,
            password: pass,
            options: { data: { full_name: name, birthday: birth } }
        });
        if (error) throw error;
        changeStep('step-otp');
    } catch (e) {
        alert(e.message);
    }
}

// 3. ПОДТВЕРЖДЕНИЕ OTP
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
        alert("Ошибка кода");
    }
}

// 4. GOOGLE
async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/index.html' }
    });
}

// ПРИВЯЗКА СОБЫТИЙ (Напрямую)
window.onload = function() {
    console.log("ОКНО ЗАГРУЖЕНО, ПРИВЯЗЫВАЮ КНОПКИ");
    
    document.getElementById('btn-continue').onclick = checkUserEmail;
    document.getElementById('btn-google').onclick = signInWithGoogle;
    
    // Для регистрации и OTP кнопок (найдем по тексту или ID если добавил)
    var regBtn = document.getElementById('btn-register-submit');
    if(regBtn) regBtn.onclick = processRegistration;

    var verifyBtn = document.getElementById('btn-verify-otp');
    if(verifyBtn) verifyBtn.onclick = processVerifyOTP;
};
