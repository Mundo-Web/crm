<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Conectando con Meta...</title>
</head>
<body style="background-color: #f3f4f6; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <div style="background-color: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); text-align: center; max-width: 400px; width: 100%;">
        <!-- Success Check Icon -->
        <div style="width: 72px; height: 72px; background-color: #d1fae5; color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
            <svg style="width: 40px; height: 40px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
            </svg>
        </div>
        <h2 style="color: #111827; font-size: 1.5rem; font-weight: 700; margin: 0 0 0.5rem;">¡Conexión Exitosa!</h2>
        <p style="color: #6b7280; font-size: 0.95rem; line-height: 1.5; margin: 0 0 1.5rem;">Autenticación con Meta completada con éxito. Transfiriendo credenciales a Atalaya CRM...</p>
        <div style="display: inline-block; width: 24px; height: 24px; border: 3px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
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
                // Try writing directly to localStorage (only works if same origin)
                try {
                    window.opener.localStorage.setItem('meta_auth_result', payload);
                } catch (e) {
                    console.log('Cross-origin detected. Using postMessage instead of direct localStorage.');
                }
                
                // Always send message via postMessage to cover cross-origin scenarios (like ngrok redirects)
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
