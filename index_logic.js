var supabaseUrl = 'https://yuhthantfmbsozvwdeuj.supabase.co';
var supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1aHRoYW50Zm1ic296dndkZXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDEzODEsImV4cCI6MjA5MjcxNzM4MX0.uzPZ7xL75IoixVJdcaoAwZSkA1WuhpINxWsjE5iBpg4';
var client = window.supabasejs || window.supabase;
var supabase = client.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async function() {
    const { data: { user } } = await supabase.auth.getUser();
    const userDisplay = document.getElementById('user-display');

    if (user) {
        // Если вошли — тянем имя из нашей таблицы profiles
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .maybeSingle();

        const name = profile?.full_name || "Пользователь";
        const avatar = profile?.avatar_url || "https://img.icons8.com/ios-filled/50/999999/user-male-circle.png";

        userDisplay.innerHTML = `
            <div class="user-logged-info" onclick="location.href='profile.html'">
                <span>${name}</span>
                <img src="${avatar}" class="profile-avatar-mini" alt="User">
            </div>
        `;
    }
});
