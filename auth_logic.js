// Используем var, чтобы избежать ошибки "already been declared"
var supabaseUrl = 'https://yuhthantfmbsozvwdeuj.supabase.co';
var supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1aHRoYW50Zm1ic296dndkZXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDEzODEsImV4cCI6MjA5MjcxNzM4MX0.uzPZ7xL75IoixVJdcaoAwZSkA1WuhpINxWsjE5iBpg4';
var supabase = supabasejs.createClient(supabaseUrl, supabaseKey);

var userEmail = "";

// Ждем загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log("HRUSTIK Auth System: Ready");

    // Привязываем кнопку Продолжить
    var btnContinue = document.getElementById('btn-continue');
    if (btnContinue) {
        btnContinue.onclick = checkEmail; // Назначаем функцию напрямую
    }

    // Привязываем кнопку Регистрации
    var btnReg = document.querySelector('#step-register .btn-blue');
    if (btnReg) {
        btnReg.onclick = startRegistration;
    }

    // Привязываем кнопку OTP
    var btnOtp = document.querySelector('#step-otp .btn-blue');
    if (btnOtp) {
        btnOtp.onclick = verifyOTP;
    }

    // Авто-фокус для OTP полей
    var otpFields = document.querySelectorAll('.otp-field');
    otpFields.forEach((field, index) => {
        field.oninput = function(e) {
            if (e.target.value && index < 5) otpFields[index + 1].focus();
        };
    });
});

// ФУНКЦИЯ ПРОВЕРКИ ПОЧТЫ
async function checkEmail() {
    var emailInput = document.getElementById('email-input');
    var emailError = document.getElementById('email-error');
    var btn = document.getElementById('btn-continue');
    
    userEmail = emailInput.value.trim();

    // Сброс ошибок
    emailInput.classList.remove('invalid');
    emailError.style.display = 'none';

    if (!userEmail || !userEmail.includes('@')) {
        emailInput.classList.add('invalid');
        emailError.style.display = 'block';
        return;
    }

    btn.innerText = "Загрузка...";
    btn.disabled = true;

    try {
        var { data, error } = await supabase
            .from('profiles')
            .select('email')
            .eq('email', userEmail)
            .maybeSingle();

        if (error) throw error;

        if (data) {
            await sendOTP(userEmail);
        } else {
            showStep('step-register');
        }
    } catch (err) {
        console.error("Ошибка:", err);
        alert("Проблема с базой данных. Проверьте SQL в Supabase.");
    } finally {
        btn.innerText = "Продолжить";
        btn.disabled = false;
    }
}

// РЕГИСТРАЦИЯ
async function startRegistration() {
    var name = document.getElementById('reg-name');
    var birth = document.getElementById('reg-birth');
    var pass = document.getElementById('reg-pass');
    var hasError = false;

    [name, birth, pass].forEach(el => el.classList.remove('invalid'));

    if (!name.value.trim()) { name.classList.add('invalid'); hasError = true; }
    
    var birthDate = new Date(birth.value);
    var age = new Date().getFullYear() - birthDate.getFullYear();
    if (!birth.value || age < 7) { birth.classList.add('invalid'); hasError = true; }

    if (pass.value.length < 6) { pass.classList.add('invalid'); hasError = true; }

    if (hasError) return;

    try {
        var { error } = await supabase.auth.signUp({
            email: userEmail,
            password: pass.value,
            options: { data: { full_name: name.value, birthday: birth.value } }
        });

        if (error) throw error;
        document.getElementById('otp-message').innerText = "Мы отправили код на " + userEmail;
        showStep('step-otp');
    } catch (err) {
        alert(err.message);
    }
}

function showStep(id) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

async function sendOTP(email) {
    var { error } = await supabase.auth.signInWithOtp({ email: email });
    if (error) throw error;
    document.getElementById('otp-message').innerText = "Код отправлен на " + email;
    showStep('step-otp');
}

async function verifyOTP() {
    var token = "";
    document.querySelectorAll('.otp-field').forEach(f => token += f.value);
    
    var { error } = await supabase.auth.verifyOTP({
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
