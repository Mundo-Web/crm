<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Str;

class GenerateMetaWebhookToken extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'meta:generate-token {--show-only : Mostrar el token sin modificar el archivo .env}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Genera un token de verificación aleatorio y seguro para el webhook global de Meta y actualiza el archivo .env';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Generar un token seguro de 40 caracteres
        $token = Str::random(40);

        if ($this->option('show-only')) {
            $this->info("🔑 Token de verificación generado:");
            $this->line("<fg=yellow;options=bold>{$token}</>");
            $this->comment("Copia este token y añádelo manualmente a tu archivo .env en META_WEBHOOK_VERIFY_TOKEN");
            return 0;
        }

        $envPath = base_path('.env');

        if (!file_exists($envPath)) {
            $this->warn("⚠️  No se encontró el archivo .env en la raíz del proyecto.");
            $this->info("🔑 Token generado para uso manual:");
            $this->line("<fg=yellow;options=bold>{$token}</>");
            return 0;
        }

        try {
            $envContent = file_get_contents($envPath);
            $key = 'META_WEBHOOK_VERIFY_TOKEN';
            $newValue = "{$key}=\"{$token}\"";

            // Buscar si ya existe la clave en el archivo .env
            if (preg_match("/^{$key}=.*/m", $envContent)) {
                // Reemplazar el valor existente
                $envContent = preg_replace("/^{$key}=.*/m", $newValue, $envContent);
                $this->info("✅ Clave {$key} actualizada en el archivo .env");
            } else {
                // Añadir al final del archivo si no existe
                $envContent .= "\n# Meta Webhook Configuration\n{$newValue}\n";
                $this->info("✅ Clave {$key} añadida al final del archivo .env");
            }

            file_put_contents($envPath, $envContent);

            $this->info("🔑 Token de verificación establecido con éxito:");
            $this->line("<fg=green;options=bold>{$token}</>");
            $this->comment("Recuerda usar este mismo token en el panel de desarrolladores de Meta (Developers > Webhooks).");

        } catch (\Exception $e) {
            $this->error("❌ Error al escribir en el archivo .env: " . $e->getMessage());
            $this->info("🔑 Puedes configurar manualmente este token generado:");
            $this->line("<fg=yellow;options=bold>{$token}</>");
        }

        return 0;
    }
}
