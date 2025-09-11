document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('password-input');
    const strengthBar = document.getElementById('strength-bar');

    if (passwordInput && strengthBar) {
        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            let strength = 0;

            // Check password length
            if (password.length >= 8) {
                strength += 1;
            }
            // Check for lowercase and uppercase letters
            if (password.match(/[a-z]/) && password.match(/[A-Z]/)) {
                strength += 1;
            }
            // Check for numbers
            if (password.match(/[0-9]/)) {
                strength += 1;
            }
            // Check for special characters
            if (password.match(/[^a-zA-Z0-9]/)) {
                strength += 1;
            }

            // Update strength bar visual
            const strengthLabels = ['weak', 'medium', 'strong', 'very-strong'];
            const strengthColors = ['#ff4d4d', '#ffbf00', '#66cc66', '#3399ff'];
            
            strengthBar.style.width = (strength * 25) + '%';
            strengthBar.style.backgroundColor = strengthColors[strength - 1] || '#ccc';

            if (password.length === 0) {
                strengthBar.style.width = '0%';
            }
        });
    }
});