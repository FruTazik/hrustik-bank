// Проверка, чтобы не объявлять дважды
if (typeof supabase === 'undefined') {
    var supabaseUrl = 'https://yuhthantfmbsozvwdeuj.supabase.co';
    var supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1aHRoYW50Zm1ic296dndkZXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDEzODEsImV4cCI6MjA5MjcxNzM4MX0.uzPZ7xL75IoixVJdcaoAwZSkA1WuhpINxWsjE5iBpg4';
    
    // Пытаемся найти библиотеку под разными именами (supabasejs или supabase)
    var lib = window.supabasejs || window.supabase;
    
    if (!lib) {
        console.error("Supabase library not found!");
    } else {
        var supabase = lib.createClient(supabaseUrl, supabaseKey);
    }
}

var userEmail = "";

document.addEventListener('DOMContentLoaded', function() {
    console.log("Кнопки инициализированы");

    // Обработка кликов
    document.getElementById('btn-continue').onclick = sendCode;
    document.getElementById('btn-verify-otp').onclick = verifyCode;
    document.getElementById('btn-finish-reg').onclick = finishRegistration;
    document.getElementById('btn-google').onclick = loginWithGoogle;

    // OTP поля
    var otpFields = document.querySelectorAll('.otp-field');
    otpFields.forEach(function(f, i) {
        f.oninput = function() {
            f.value = f.value.replace(/\D/g, '');
            if (f.value && i < 5) otpFields[i+1].focus();
        };
        f.onkeydown = function(e) {
            if (e.key === 'Backspace' && !f.value && i > 0) otpFields[i-1].focus();
        };
    });

    // Маска даты
    var birth = document.getElementById('reg-birth');
    if (birth) {
        birth.oninput = function() {
            var v = birth.value.replace(/\D/g, '');
            if (v.length > 2) v = v.slice(0,2) + '.' + v.slice(2);
            if (v.length > 5) v = v.slice(0,5) + '.' + v.slice(5,10);
            birth.value = v;
        };
    }
});

async function sendCode() {
    userEmail = document.getElementById('email-input').value.trim();
    if (!userEmail.includes('@')) {
        document.getElementById('email-error').style.display = 'block';
        return;
    }
    var res = await supabase.auth.signInWithOtp({ email: userEmail });
    if (res.error) alert(res.error.message);
    else changeStep('step-otp');
}

async function verifyCode() {
    var token = "";
    document.querySelectorAll('.otp-field').forEach(function(f) { token += f.value; });
    
    if (token.length < 6) return alert("Введите код полностью");

    var res = await supabase.auth.verifyOTP({
        email: userEmail,
        token: token,
        type: 'email'
    });

    if (res.error) return alert("Неверный код");

    // Проверка профиля
    var prof = await supabase.from('profiles').select('full_name').eq('id', res.data.user.id).maybeSingle();

    if (prof.data && prof.data.full_name) {
        window.location.href = 'index.html';
    } else {
        changeStep('step-register');
    }
}

async function finishRegistration() {
    var name = document.getElementById('reg-name').value.trim();
    var birth = document.getElementById('reg-birth').value.trim();
    
    if (!name || birth.length < 10) return alert("Заполните данные");

    var userRes = await supabase.auth.getUser();
    var user = userRes.data.user;

    var ins = await supabase.from('profiles').insert([
        { id: user.id, email: user.email, full_name: name, birthday: birth }
    ]);

    if (ins.error) alert(ins.error.message);
    else window.location.href = 'index.html';
}

async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + window.location.pathname.replace('auth.html', 'index.html') }
    });
}

function changeStep(id) {
    document.querySelectorAll('.step').forEach(function(s) { s.classList.remove('active'); });
    document.getElementById(id).classList.add('active');
}
