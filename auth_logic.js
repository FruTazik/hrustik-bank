// Используем объект-контейнер, чтобы избежать ошибки "Identifier already declared"
window.AuthApp = {
    url: 'https://yuhthantfmbsozvwdeuj.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1aHRoYW50Zm1ic296dndkZXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDEzODEsImV4cCI6MjA5MjcxNzM4MX0.uzPZ7xL75IoixVJdcaoAwZSkA1WuhpINxWsjE5iBpg4',
    client: null,
    email: "",

    init: function() {
        // Инициализация клиента
        const lib = window.supabasejs || window.supabase;
        if (!lib) return console.error("Supabase lib missing");
        this.client = lib.createClient(this.url, this.key);

        // Привязка событий
        document.getElementById('btn-continue').onclick = () => this.sendCode();
        document.getElementById('btn-verify-otp').onclick = () => this.verifyCode();
        document.getElementById('btn-finish-reg').onclick = () => this.finishReg();
        document.getElementById('btn-google').onclick = () => this.loginGoogle();

        this.setupOtpLogic();
        this.setupDateMask();
    },

    changeStep: function(stepId) {
        document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
        document.getElementById(stepId).classList.add('active');
    },

    sendCode: async function() {
        this.email = document.getElementById('email-input').value.trim();
        if (!this.email.includes('@')) return alert("Введите почту");
        
        const { error } = await this.client.auth.signInWithOtp({ email: this.email });
        if (error) alert(error.message);
        else this.changeStep('step-otp');
    },

    verifyCode: async function() {
        let token = "";
        document.querySelectorAll('.otp-field').forEach(f => token += f.value);
        if (token.length < 6) return alert("Введите 6 цифр");

        const { data, error } = await this.client.auth.verifyOTP({
            email: this.email,
            token: token,
            type: 'email'
        });

        if (error) return alert("Неверный код");

        const { data: prof } = await this.client.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
        if (prof && prof.full_name) window.location.href = 'index.html';
        else this.changeStep('step-register');
    },

    finishReg: async function() {
        const name = document.getElementById('reg-name').value.trim();
        const birth = document.getElementById('reg-birth').value.trim();
        const { data: { user } } = await this.client.auth.getUser();

        const { error } = await this.client.from('profiles').insert([
            { id: user.id, email: user.email, full_name: name, birthday: birth }
        ]);

        if (error) alert(error.message);
        else window.location.href = 'index.html';
    },

    loginGoogle: async function() {
        await this.client.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + window.location.pathname.replace('auth.html', 'index.html') }
        });
    },

    setupOtpLogic: function() {
        const fields = document.querySelectorAll('.otp-field');
        fields.forEach((f, i) => {
            f.oninput = () => {
                f.value = f.value.replace(/\D/g, '');
                if (f.value && i < 5) fields[i+1].focus();
            };
            f.onkeydown = (e) => {
                if (e.key === 'Backspace' && !f.value && i > 0) fields[i-1].focus();
            };
        });
    },

    setupDateMask: function() {
        const b = document.getElementById('reg-birth');
        if (!b) return;
        b.oninput = () => {
            let v = b.value.replace(/\D/g, '');
            if (v.length > 2) v = v.slice(0,2) + '.' + v.slice(2);
            if (v.length > 5) v = v.slice(0,5) + '.' + v.slice(5,10);
            b.value = v;
        };
    }
};

// Запуск при загрузке
document.addEventListener('DOMContentLoaded', () => window.AuthApp.init());
