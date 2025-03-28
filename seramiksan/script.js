// script.js
document.getElementById('contactForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Formun varsayılan gönderimini engelle

    // Form verilerini al
    const isim = document.getElementById('isim').value;
    const email = document.getElementById('email').value;
    const mesaj = document.getElementById('mesaj').value;

    // Mesaj gönderildi bildirimini göster
    const notification = document.getElementById('notification');
    notification.classList.remove('hidden');
    notification.textContent = `Teşekkürler ${isim}, mesajınız gönderildi!`;

    // Formu sıfırla
    document.getElementById('contactForm').reset();
});