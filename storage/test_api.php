<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$request = Illuminate\Http\Request::create('/api/leads/paginate', 'POST', [
    'filter' => [
        ['clients.status_id', '=', 'e05a43e5-b3a6-46ce-8d1f-381a73498f33'],
        'and',
        ['clients.chat_status_id', '=', 'some-uuid']
    ]
]);
$response = app()->handle($request);
echo $response->getContent();
