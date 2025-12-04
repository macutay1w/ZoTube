document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('main-video');
    const videoCards = document.querySelectorAll('.video-card');
    
    // Video kartlarına tıklama etkileşimi
    videoCards.forEach(card => {
        card.addEventListener('click', () => {
            // Gerçek uygulamada burada yeni video yüklenecek
            const newTitle = card.querySelector('.video-card-title').textContent;
            document.querySelector('.video-title').textContent = newTitle;
            
            // Basit bir animasyon
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                card.style.transform = '';
            }, 200);
            
            // Video yeniden başlat
            video.currentTime = 0;
        });
    });
    
    // Video boyutunu ayarla
    function resizeVideo() {
        const container = document.querySelector('.video-player-container');
        video.style.width = '100%';
        video.style.height = 'auto';
    }
    
    window.addEventListener('resize', resizeVideo);
    resizeVideo();
    
    // Video oynatıcıya odaklanınca klavye kontrolleri
    video.addEventListener('focus', () => {
        video.setAttribute('controls', 'true');
    });
    
    // Özel klavye kontrolleri
    document.addEventListener('keydown', (e) => {
        if (document.activeElement !== video) return;
        
        switch(e.key) {
            case ' ':
                e.preventDefault();
                video.paused ? video.play() : video.pause();
                break;
            case 'ArrowRight':
                video.currentTime += 5;
                break;
            case 'ArrowLeft':
                video.currentTime -= 5;
                break;
            case 'ArrowUp':
                video.volume = Math.min(video.volume + 0.1, 1);
                break;
            case 'ArrowDown':
                video.volume = Math.max(video.volume - 0.1, 0);
                break;
            case 'f':
                video.requestFullscreen();
                break;
            case 'm':
                video.muted = !video.muted;
                break;
        }
    });
});