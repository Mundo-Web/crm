<?php
$longLivedToken = 'EAAUBcosZCE48BRXK921PnWnvw1rH3aQom1kT3Tg3uDhBfyTZBQhdNyolGmIPJun3U1fhaxkBZBneBWKZAtzHOG2Cu456J6Q2gqZBDMfC53vfjEA23tkgfVYBOAhXnVEsYdrUkZBA7nZBixevg2l5IA88WdkFTqF72iv8SZCf00UZBbHvwex1RgW5qQXcx0kSg7wOwj4QZD';
$url = "https://graph.facebook.com/v20.0/me/accounts?access_token=" . $longLivedToken;

$opts = ["http" => ["ignore_errors" => true]];
$context = stream_context_create($opts);
$response = file_get_contents($url, false, $context);
echo $response;
