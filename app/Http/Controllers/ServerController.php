<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ServerController extends Controller
{
    /**
     * Allowed read-only commands. Only these can be executed.
     */
    private const ALLOWED_COMMANDS = [
        'supervisor_status' => 'supervisorctl status',
        'queue_workers'     => 'ps aux | grep -E "queue:work|artisan" | grep -v grep',
        'php_version'       => 'php -v',
        'disk_usage'        => 'df -h /',
        'memory_usage'      => 'free -h',
        'uptime'            => 'uptime',
        'laravel_env'       => null, // handled manually
    ];

    /**
     * Run a safe, read-only diagnostic command on the server.
     */
    public function status(Request $request)
    {
        $cmd = $request->query('cmd', 'supervisor_status');

        if (!array_key_exists($cmd, self::ALLOWED_COMMANDS)) {
            return response()->json([
                'success' => false,
                'output'  => 'Comando no permitido.',
            ], 403);
        }

        // Laravel env info: no shell command needed
        if ($cmd === 'laravel_env') {
            $output = implode("\n", [
                'APP_ENV    = ' . config('app.env'),
                'APP_DEBUG  = ' . (config('app.debug') ? 'true' : 'false'),
                'QUEUE_CONN = ' . config('queue.default'),
                'CACHE_DRV  = ' . config('cache.default'),
                'MAIL_MAILER= ' . config('mail.default'),
                'DB_DRIVER  = ' . config('database.default'),
            ]);
            return response()->json(['success' => true, 'output' => $output, 'cmd' => $cmd]);
        }

        $shellCmd = self::ALLOWED_COMMANDS[$cmd];

        // Execute with a timeout and capture stderr too
        $descriptorSpec = [
            1 => ['pipe', 'w'], // stdout
            2 => ['pipe', 'w'], // stderr
        ];

        $process = proc_open($shellCmd . ' 2>&1', $descriptorSpec, $pipes);

        if (!is_resource($process)) {
            return response()->json([
                'success' => false,
                'output'  => 'No se pudo ejecutar el comando en el servidor.',
            ]);
        }

        $output = stream_get_contents($pipes[1]);
        fclose($pipes[1]);
        proc_close($process);

        return response()->json([
            'success' => true,
            'output'  => trim($output) ?: '(sin salida)',
            'cmd'     => $cmd,
        ]);
    }
}
