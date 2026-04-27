var supabaseUrl = 'https://yuhthantfmbsozvwdeuj.supabase.co';
var supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1aHRoYW50Zm1ic296dndkZXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDEzODEsImV4cCI6MjA5MjcxNzM4MX0.uzPZ7xL75IoixVJdcaoAwZSkA1WuhpINxWsjE5iBpg4';
var client = window.supabasejs || window.supabase;
var supabase = client.createClient(supabaseUrl, supabaseKey);

var userEmail = "";

document.addEventListener('DOMContentLoaded', function() {
    // --- ПРИВЯЗКА КНОПОК ---
    document.getElementById('btn-continue').onclick = checkUserEmail;
    document.getElementById('btn-google').onclick = signInWithGoogle;
    document.getElementById('btn-register-submit').onclick = processRegistration;
    document.getElementById('btn-verify-otp').onclick = processVerifyOTP;

    // --- ЛОГИКА ПОЛЕЙ OTP ---
    const otpFields = document.querySelectorAll('.otp-field');
    otpFields.forEach((field, index) => {
        // Только цифры + автопереход вперед
        field.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            if (e.target.value && index < 5) otpFields[index + 1].focus();
        });

        // Удаление (Backspace) - прыжок назад
        field.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !field.value && index > 0) {
                otpFields[index - 1].focus();
            }
        });
    });

    // --- МАСКА ДАТЫ (ДД.ММ.ГГГГ) ---
    const birthInput = document.getElementById('reg-birth');
    if (birthInput) {
        birthInput.addEventListener('input', function(e) {
            let v = e.target.value.replace(/\D/g, ''); // Удаляем всё кроме цифр
            if (v.length > 2) v = v.slice(0,2) + '.' + v.slice(2);
            if (v.length > 5) v = v.slice(0,5) + '.' + v.slice(5,10);
            e.target.value = v;
        });
    }
});

// --- ФУНКЦИИ ---

async function checkUserEmail() {
    var emailInput = document.getElementById('email-input');
    userEmail = emailInput.value.trim();
    if (!userEmail.includes('@')) {
        document.getElementById('email-error').style.display = 'block';
        return;
    }
    try {
        var { data } = await supabase.from('profiles').select('email').eq('email', userEmail).maybeSingle();
        if (data) {
            await supabase.auth.signInWithOtp({ email: userEmail });
            changeStep('step-otp');
        } else {
            changeStep('step-register');
        }
    } catch (e) { alert(e.message); }
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
        options: { redirectTo: window.location.origin + window.location.pathname.replace('auth.html', 'index.html') }
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
