<?php

namespace Tests\Feature;

use App\Models\Atalaya\Business;
use App\Models\Integration;
use App\Models\Client;
use App\Models\ClientNote;
use App\Models\Task;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class GoogleAdsWebhookTest extends TestCase
{
    use DatabaseTransactions;

    public function test_google_ads_webhook_creates_lead()
    {
        // 1. Get an existing business
        $business = Business::where('status', true)->first();
        if (!$business) {
            $business = Business::create([
                'uuid' => (string) \Illuminate\Support\Str::uuid(),
                'name' => 'Test Business',
                'status' => true
            ]);
        }

        // 2. Create a temporary integration for google-ads
        $integration = Integration::create([
            'business_id' => $business->id,
            'meta_service' => 'google-ads',
            'meta_business_id' => '123-456-7890',
            'meta_business_name' => 'Test Google Ads Account',
            'meta_access_token' => 'dummy_refresh_token',
            'status' => true
        ]);

        // 3. Prepare Google Ads Webhook Payload
        $payload = [
            'google_key' => $business->uuid,
            'lead_id' => 'google_test_lead_999',
            'campaign_id' => '888888',
            'adgroup_id' => '777777',
            'creative_id' => '666666',
            'user_column_data' => [
                [
                    'column_id' => 'FULL_NAME',
                    'column_name' => 'Full Name',
                    'string_value' => 'Pepito Google'
                ],
                [
                    'column_id' => 'EMAIL',
                    'column_name' => 'Email',
                    'string_value' => 'pepito.google@gmail.com'
                ],
                [
                    'column_id' => 'PHONE_NUMBER',
                    'column_name' => 'Phone',
                    'string_value' => '51999999999'
                ],
                [
                    'column_id' => 'COMPANY_NAME',
                    'column_name' => 'Company',
                    'string_value' => 'Google Inc'
                ]
            ]
        ];

        // 4. Send POST Request to the webhook route
        $response = $this->postJson("/meta/google-ads/{$business->uuid}", $payload);

        // 5. Assert successful response
        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        // 6. Assert lead was created in clients table
        $client = Client::where('integration_id', $integration->id)
            ->where('integration_user_id', 'google_test_lead_999')
            ->first();

        $this->assertNotNull($client);
        $this->assertEquals('Pepito Google', $client->name);
        $this->assertEquals('51999999999', $client->contact_phone);
        $this->assertEquals('pepito.google@gmail.com', $client->contact_email);
        $this->assertEquals('Google Inc', $client->tradename);
        $this->assertEquals('Google Ads', $client->origin);
        $this->assertEquals('google-ads', $client->lead_origin);

        // 7. Assert ClientNote was created with form answers
        $note = ClientNote::where('client_id', $client->id)->first();
        $this->assertNotNull($note);
        $this->assertStringContainsString('Pepito Google', $note->description);

        // 8. Assert Task was created
        $task = Task::where('model_id', ClientNote::class)
            ->where('note_id', $note->id)
            ->first();
        $this->assertNotNull($task);
        $this->assertEquals('Revisar lead Google Ads', $task->name);
    }
}
