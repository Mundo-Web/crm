<?php
$appId = '1408966357619599';
$appSecret = '432050a21b3f1a95d8587690e2fff7dd';
$shortToken = 'EAAUBcosZCE48BRUMYMV0ANtW1M1JCjtOKZBoaf6dNXqwj85hCZCC4nbsp4YZB8UdkmQztvtp0wJJMeDpUbuHHwUaTlk8YjXVVh0DtrZA0AUPTxFXfvMxEwZB0rtxaIuYXvXmtLBSEBzrYAhwadZBkcnOZBwknzvGPst5BUQNQXZBZAyk7ofcHsLSMMd08tgOL7HJtBF9fhtczE8ked30YJxZAKxZCwBzHZByF7UtokyAMXQZDZD';

$url = "https://graph.facebook.com/v20.0/oauth/access_token?" . http_build_query([
    'grant_type' => 'fb_exchange_token',
    'client_id' => $appId,
    'client_secret' => $appSecret,
    'fb_exchange_token' => $shortToken
]);

$response = file_get_contents($url);
echo $response;
