<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Conectando con Google Ads...</title>
</head>
<body style="background-color: #121212; color: #ffffff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <div style="background-color: #1e1e1e; border: 1px solid #333333; padding: 2.5rem; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4); text-align: center; max-width: 400px; width: 100%;">
        <div style="width: 80px; height: 80px; background-color: #111111; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; position: relative;">
            <div style="position: absolute; inset: 0; border-radius: 50%; border: 3px solid #4285F4; opacity: 0.8; filter: drop-shadow(0 0 4px #4285F4);"></div>
            <div style="position: absolute; inset: 2px; border-radius: 50%; border: 3px solid #FBBC05; opacity: 0.8; filter: drop-shadow(0 0 4px #FBBC05);"></div>
            
            <svg style="width: 40px; height: 40px; color: #ffffff; position: relative; z-index: 2;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M5 13l4 4L19 7"></path>
            </svg>
        </div>
        
        <h2 style="color: #ffffff; font-size: 1.6rem; font-weight: 700; margin: 0 0 0.5rem; background: linear-gradient(45deg, #4285F4, #FBBC05); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">¡Conexión Exitosa!</h2>
        <p style="color: #aaaaaa; font-size: 0.95rem; line-height: 1.5; margin: 0 0 1.8rem;">Autenticación con Google completada. Transfiriendo credenciales a Atalaya CRM...</p>
        
        <div style="position: relative; width: 32px; height: 32px; margin: 0 auto;">
            <div style="position: absolute; width: 100%; height: 100%; border: 4px solid rgba(255, 255, 255, 0.1); border-radius: 50%;"></div>
            <div style="position: absolute; width: 100%; height: 100%; border: 4px solid transparent; border-top-color: #4285F4; border-bottom-color: #FBBC05; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        </div>
    </div>

    <style>
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>

    <script>
        try {
            const payload = "{{ $payload }}";
            if (window.opener) {
                try {
                    window.opener.localStorage.setItem('meta_auth_result', payload);
                } catch (e) {
                    console.log('Cross-origin detected. Using postMessage instead of direct localStorage.');
                }
                window.opener.postMessage({ type: 'meta_auth_result', payload: payload }, '*');
            } else {
                localStorage.setItem('meta_auth_result', payload);
            }
        } catch (e) {
            console.error('Error sharing credentials with parent window:', e);
        }
        setTimeout(function() {
            window.close();
        }, 1500);
    </script>
</body>
</html>
