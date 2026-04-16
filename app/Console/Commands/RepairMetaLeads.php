<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Client;
use App\Models\Integration;
use SoDe\Extend\Fetch;

class RepairMetaLeads extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'clients:repair-meta';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Repara leads de Meta añadiendo adset_name y ad_name consultando la API de Facebook';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $clients = Client::where('source', 'Meta')
            ->whereNotNull('integration_user_id')
            ->where(function ($query) {
                $query->whereNull('adset_name')->orWhereNull('ad_name');
            })
            ->get();

        $count = $clients->count();
        $this->info("Encontrados {$count} leads para reparar.");

        if ($count === 0) {
            return 0;
        }

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        foreach ($clients as $client) {
            try {
                $integration = Integration::find($client->integration_id);
                if (!$integration || !$integration->meta_access_token) {
                    $bar->advance();
                    continue;
                }

                $leadId = $client->integration_user_id;
                $url = env('FACEBOOK_GRAPH_URL', 'https://graph.facebook.com/v19.0') . '/' . $leadId . '?fields=adset_name,ad_name';
                
                $res = new Fetch($url, [
                    'headers' => [
                        'Authorization' => 'Bearer ' . $integration->meta_access_token
                    ]
                ]);
                $data = $res->json();

                if (isset($data['error'])) {
                    // Log error or skip
                    $bar->advance();
                    continue;
                }

                if (isset($data['adset_name']) || isset($data['ad_name'])) {
                    $client->adset_name = $data['adset_name'] ?? $client->adset_name;
                    $client->ad_name = $data['ad_name'] ?? $client->ad_name;
                    $client->save();
                }
            } catch (\Exception $e) {
                // Silently skip or log
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Reparación completada.");
        
        return 0;
    }
}
