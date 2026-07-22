<?php

namespace App\Http\Controllers;

use App\Jobs\SaveNotification;
use App\Jobs\SendNewLeadNotification;
use App\Models\Atalaya\Business;
use App\Models\Atalaya\BusinessSign;
use App\Models\BusinessSector;
use App\Models\Campaign;
use App\Models\Client;
use App\Models\ClientNote;
use App\Models\DefaultMessage;
use App\Models\Message;
use App\Models\NoteType;
use App\Models\Process;
use App\Models\Product;
use App\Models\Project;
use App\Models\Setting;
use App\Models\Status;

use App\Models\Task;
use App\Models\Type;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Excel as MaatwebsiteExcel;
use Maatwebsite\Excel\Facades\Excel;
use Ramsey\Uuid\Uuid;
use SoDe\Extend\JSON;
use SoDe\Extend\Response;
use SoDe\Extend\Text;
use SoDe\Extend\Trace;

use function PHPSTORM_META\map;

class LeadController extends BasicController
{
    public $model = Client::class;
    public $softDeletion = false;
    public $reactView = 'Leads';
    public $prefix4filter = 'clients';

    public function setReactViewProperties(Request $request)
    {
        $statuses = Status::select()
            ->whereIn('table_id', ['e05a43e5-b3a6-46ce-8d1f-381a73498f33', 'a8367789-666e-4929-aacb-7cbc2fbf74de'])
            ->where('business_id', Auth::user()->business_id)
            ->where('status', true)
            ->get();
        $defaultClientStatus = Setting::get('default-client-status');
        $defaultLeadStatus = Setting::get('default-lead-status');
        $convertedLeadStatus = Setting::get('converted-lead-status');

        $noteTypes = NoteType::all();

        $manageStatuses = Status::select()
            ->where('table_id', '9c27e649-574a-47eb-82af-851c5d425434')
            ->where('business_id', Auth::user()->business_id)
            ->where('status', true)
            ->get();

        $chatStatuses = Status::select()
            ->where('table_id', '584dfcba-4b2a-464a-9721-3dfc82bf83f2')
            ->where('business_id', Auth::user()->business_id)
            ->where('status', true)
            ->get();

        $products = Product::with('type')
            ->where('business_id', Auth::user()->business_id)
            ->where('status', true)
            ->get();

        $processes = Process::where('business_id', Auth::user()->business_id)->get();

        $defaultMessages = DefaultMessage::with(['attachments'])
            ->where('business_id', Auth::user()->business_id)
            ->where('user_id', Auth::id())
            ->get();

        $signs = BusinessSign::select()
            ->where('business_id', Auth::user()->business_id)
            ->where('user_id', Auth::id())
            ->get();

        $projectTypes = Type::where('table_id', 'cd8bd48f-c73c-4a62-9935-024139f3be5f')
            ->where('business_id', Auth::user()->business_id)
            ->get();

        $usersJpa = User::byBusiness();

        $question = Setting::get('gemini-extra-questions');

        $hasForms = false;
        if ($question && is_string($question)) {
            $decoded = json_decode($question, true);
            if (is_array($decoded)) {
                foreach ($decoded as $form) {
                    if (isset($form['questions']) && is_array($form['questions']) && count($form['questions']) > 0) {
                        $hasForms = true;
                        break;
                    }
                }
            }
        }

        $currentMonth = date('m');
        $currentYear = date('Y');

        $months = Client::select([
            DB::raw("DATE_FORMAT(clients.created_at, '%Y-%m') as id"),
            DB::raw('YEAR(clients.created_at) AS year'),
            DB::raw('MONTH(clients.created_at) AS month'),
            DB::raw('count(clients.id) AS quantity')
        ])
            ->where('clients.business_id', Auth::user()->business_id)
            ->groupBy(
                DB::raw('YEAR(clients.created_at)'),
                DB::raw('MONTH(clients.created_at)'),
                DB::raw("DATE_FORMAT(clients.created_at, '%Y-%m')")
            )
            ->orderBy(DB::raw('YEAR(clients.created_at)'), 'desc')
            ->orderBy(DB::raw('MONTH(clients.created_at)'), 'desc')
            ->get()->toArray();

        $found = false;
        foreach ($months as $month) {
            if ($month['id'] == ("{$currentYear}-{$currentMonth}")) {
                $found = true;
                break;
            }
        }

        // Si no se encontró, agregar un nuevo item
        if (!$found) {
            array_unshift($months, [
                'id' => "{$currentYear}-{$currentMonth}",
                'year' => $currentYear,
                'month' => $currentMonth,
                'quantity' => 0
            ]);
        }


        return [
            'lead' => $request->lead,
            'manageStatuses' => $manageStatuses,
            'chatStatuses' => $chatStatuses,
            'defaultClientStatus' => $defaultClientStatus,
            'defaultLeadStatus' => $defaultLeadStatus,
            'convertedLeadStatus' => $convertedLeadStatus,
            'statuses' => $statuses,
            'noteTypes' => $noteTypes,
            'products' => $products,
            'processes' => $processes,
            'defaultMessages' => $defaultMessages,
            'signs' => $signs,
            'users' => $usersJpa,
            'projectTypes' => $projectTypes,
            'hasForms' => $hasForms,
            'months' => $months,
            'currentMonth' => $currentMonth,
            'currentYear' => $currentYear,
        ];
    }

    public function get(Request $request, string $lead)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($lead) {
            $data = $this->model::select('clients.*')
                ->addSelect([
                    'last_human_message_microtime' => Message::select('microtime')
                        ->where(function ($q) {
                            $q->whereColumn('messages.wa_id', 'clients.contact_phone')
                              ->orWhereColumn('messages.wa_id', 'clients.integration_user_id');
                        })
                        ->where('messages.role', 'Human')
                        ->whereColumn('messages.business_id', 'clients.business_id')
                        ->orderBy('microtime', 'desc')
                        ->limit(1)
                ])
                ->withCount(['notes', 'tasks', 'pendingTasks', 'products'])
                ->with(['status', 'assigned', 'manageStatus', 'chatStatus', 'creator', 'businessSector', 'entries.campaign'])
                ->join('statuses AS status', 'status.id', 'status_id')
                ->leftJoin('statuses AS manage_status', 'manage_status.id', 'manage_status_id')
                ->whereIn('status.table_id', ['e05a43e5-b3a6-46ce-8d1f-381a73498f33', 'a8367789-666e-4929-aacb-7cbc2fbf74de'])
                ->where('clients.business_id', Auth::user()->business_id)
                ->where('clients.id', $lead)
                ->first();
            $response->data = $data;
        });
        return response($response->toArray(), $response->status);
    }

    public function setPaginationInstance(Request $request, string $model)
    {
        $suffix = $request->suffix;
        $defaultLeadStatus = Setting::get('default-lead-status');
        $query = $model::select($request->fields ?? 'clients.*')
            ->addSelect([
                'last_human_message_microtime' => Message::select('microtime')
                    ->where(function ($q) {
                        $q->whereColumn('messages.wa_id', 'clients.contact_phone')
                          ->orWhereColumn('messages.wa_id', 'clients.integration_user_id');
                    })
                    ->where('messages.role', 'Human')
                    ->whereColumn('messages.business_id', 'clients.business_id')
                    ->orderBy('microtime', 'desc')
                    ->limit(1)
            ])
            ->withCount($request->withCount ?? ['notes', 'tasks', 'pendingTasks', 'products'])
            ->with($request->with ?? ['status', 'assigned', 'manageStatus', 'chatStatus', 'creator', 'integration', 'campaign', 'businessSector', 'entries.campaign'])
            ->leftJoin('statuses AS status', 'status.id', 'status_id')
            ->leftJoin('statuses AS manage_status', 'manage_status.id', 'manage_status_id')
            ->leftJoin('users AS assigned', 'assigned.id', 'clients.assigned_to')
            ->leftJoin('campaigns AS campaign', 'campaign.id', 'clients.campaign_id')
            ->leftJoin('business_sectors AS business_sector', 'business_sector.id', 'clients.business_sector_id')
            ->where(function ($q) use ($request) {
                if ($request->includeClients) {
                    $q->whereIn('status.table_id', ['e05a43e5-b3a6-46ce-8d1f-381a73498f33', 'a8367789-666e-4929-aacb-7cbc2fbf74de']);
                } else {
                    $q->where('status.table_id', 'e05a43e5-b3a6-46ce-8d1f-381a73498f33');
                }
            })
            ->where('clients.status', true)
            ->where('clients.business_id', Auth::user()->business_id);

        if ($suffix == 'served') $query = $query->where('clients.status_id', '<>', $defaultLeadStatus);
        if ($suffix == 'new' || $suffix == 'incomplete') {
            $query = $query->where('clients.status_id', $defaultLeadStatus);
            $question = Setting::get('gemini-extra-questions');

            $hasForms = false;
            if ($question && is_string($question)) {
                $decoded = json_decode($question, true);
                if (is_array($decoded)) {
                    foreach ($decoded as $form) {
                        if (isset($form['questions']) && is_array($form['questions']) && count($form['questions']) > 0) {
                            $hasForms = true;
                            break;
                        }
                    }
                }
            }

            if ($suffix == 'new' && $hasForms) {
                $query = $query->where('clients.complete_registration', true);
            }
            if ($suffix == 'incomplete') {
                $query = $query->where('clients.complete_registration', false);
            }
        }

        return $query;
    }

    /**
     * Preview / dry-run de la importación: procesa el Excel sin escribir nada en la DB.
     * Devuelve un resumen detallado: totales, nuevos vs existentes, con/sin campaña, muestra de filas.
     */
    public function importPreview(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {
            $file    = $request->file('file');
            $mapping = json_decode($request->mapping, true);

            $readerType = MaatwebsiteExcel::XLSX;
            $extension  = strtolower($file->getClientOriginalExtension());
            if ($extension === 'xls')      $readerType = MaatwebsiteExcel::XLS;
            elseif ($extension === 'csv')  $readerType = MaatwebsiteExcel::CSV;

            $rows    = Excel::toArray([], $file->getRealPath(), null, $readerType)[0];
            $headers = array_shift($rows);

            $cleanRows = [];
            foreach ($rows as $row) {
                $rowData = [];
                foreach ($headers as $index => $header) {
                    $rowData[$header] = $row[$index] ?? null;
                }
                if (collect($rowData)->filter(fn($v) => trim((string)$v) !== '')->isNotEmpty()) {
                    $cleanRows[] = $rowData;
                }
            }

            $business_id       = Auth::user()->business_id;
            $campaignIdColumn  = $mapping['campaign_id']   ?? null;
            $campaignNameColumn= $mapping['campaign_name'] ?? null;
            $stripMetaPrefix   = fn(string $v): string => trim(preg_replace('/^[a-z]+:/i', '', $v));

            // Recopilar códigos de campaña
            $campaignCodes = [];
            if ($campaignIdColumn) {
                $campaignCodes = array_unique(array_filter(array_map(
                    fn($v) => $stripMetaPrefix((string)$v),
                    array_column($cleanRows, $campaignIdColumn)
                )));
            } elseif ($campaignNameColumn) {
                $campaignCodes = array_unique(array_filter(array_map(
                    fn($v) => $stripMetaPrefix((string)$v),
                    array_column($cleanRows, $campaignNameColumn)
                )));
            }

            $existingCampaigns = Campaign::where('business_id', $business_id)
                ->whereIn('code', $campaignCodes)
                ->pluck('id', 'code');

            // Mapear filas (igual que en import real, pero solo en memoria)
            $mappedRows = [];
            foreach ($cleanRows as $row) {
                $phone = \SoDe\Extend\Text::keep($row[$mapping['phone']], '0123456789');
                if (strlen($phone) === 9 && str_starts_with($phone, '9')) {
                    $phone = '51' . $phone;
                }

                $adId = null;
                if ($campaignIdColumn)  $adId = $row[$campaignIdColumn]   ?? null;
                elseif ($campaignNameColumn) $adId = $row[$campaignNameColumn] ?? null;
                if ($adId !== null) $adId = trim(preg_replace('/^[a-z]+:/i', '', $adId));

                $campaignId = ($adId && isset($existingCampaigns[$adId])) ? $existingCampaigns[$adId] : null;

                $originRaw = strtolower($row[$mapping['source']] ?? '');
                $origin = match ($originRaw) {
                    'fb', 'facebook'   => 'Facebook',
                    'ig', 'instagram'  => 'Instagram',
                    default            => $row[$mapping['source']] ?? null,
                };

                $adsetColumn = $mapping['adset_name'] ?? null;
                $adColumn    = $mapping['ad_name']    ?? null;
                $adsetName   = $adsetColumn ? (trim(preg_replace('/^[a-z]+:/i', '', $row[$adsetColumn] ?? '')) ?: null) : null;
                $adName      = $adColumn    ? (trim(preg_replace('/^[a-z]+:/i', '', $row[$adColumn]    ?? '')) ?: null) : null;

                $dateRaw  = isset($mapping['date']) && !empty($row[$mapping['date']]) ? $row[$mapping['date']] : null;
                $parsedDt = $dateRaw ? Carbon::parse($dateRaw) : Carbon::now();

                $mappedRows[] = [
                    'name'           => $row[$mapping['name']] ?? null,
                    'contact_email'  => $row[$mapping['email']] ?? null,
                    'contact_phone'  => $phone ?: null,
                    'origin'         => $origin,
                    'campaign_id'    => $campaignId,
                    'adset_name'     => $adsetName,
                    'ad_name'        => $adName,
                    'date'           => $parsedDt->format('Y-m-d H:i:s'),
                    '_has_campaign'  => !is_null($campaignId),
                    '_raw_campaign'  => $adId,
                ];
            }

            // Detectar existentes por email / teléfono
            $emails       = array_filter(array_unique(array_map('strtolower', array_map('trim', array_column($mappedRows, 'contact_email')))));
            $phoneSuffixes = [];
            foreach ($mappedRows as $r) {
                $c = preg_replace('/[^0-9]/', '', $r['contact_phone'] ?? '');
                $s = substr($c, -9);
                if (strlen($s) === 9) $phoneSuffixes[] = $s;
            }
            $phoneSuffixes = array_unique($phoneSuffixes);

            $existingClients = collect();
            if (!empty($emails) || !empty($phoneSuffixes)) {
                $existingClients = Client::where('business_id', $business_id)
                    ->where(function ($q) use ($emails, $phoneSuffixes) {
                        $hasCond = false;
                        if (!empty($emails)) {
                            $q->whereIn(DB::raw('LOWER(contact_email)'), array_values($emails));
                            $hasCond = true;
                        }
                        if (!empty($phoneSuffixes)) {
                            $suffixesString = implode("','", array_map('addslashes', $phoneSuffixes));
                            if ($hasCond) $q->orWhereRaw("RIGHT(REGEXP_REPLACE(contact_phone, '[^0-9]', ''), 9) IN ('{$suffixesString}')");
                            else          $q->whereRaw("RIGHT(REGEXP_REPLACE(contact_phone, '[^0-9]', ''), 9) IN ('{$suffixesString}')");
                        }
                    })
                    ->get(['id', 'name', 'contact_email', 'contact_phone', 'status_id', 'created_at']);
            }

            $newRows      = [];
            $existingRows = [];
            foreach ($mappedRows as $row) {
                $rowEmail  = $row['contact_email'] ? strtolower(trim($row['contact_email'])) : null;
                $rowPhoneC = preg_replace('/[^0-9]/', '', $row['contact_phone'] ?? '');
                $rowPhoneS = substr($rowPhoneC, -9);

                $found = $existingClients->first(function ($client) use ($rowEmail, $rowPhoneS) {
                    if ($rowEmail && strtolower(trim($client->contact_email)) === $rowEmail) return true;
                    if (strlen($rowPhoneS) === 9) {
                        $cp = preg_replace('/[^0-9]/', '', $client->contact_phone ?? '');
                        if (substr($cp, -9) === $rowPhoneS) return true;
                    }
                    return false;
                });

                $row['_status'] = $found ? 'existing' : 'new';
                $row['_existing_id']   = $found?->id;
                $row['_existing_name'] = $found?->name;
                $row['_existing_since']= $found?->created_at;

                if ($found) $existingRows[] = $row;
                else        $newRows[]      = $row;
            }

            // Estadísticas por campaña — usar filas ya clasificadas
            $allClassified = array_merge($newRows, $existingRows);
            $campaignStats = [];
            foreach ($allClassified as $row) {
                $cKey = $row['_has_campaign'] ? ($row['_raw_campaign'] ?? 'sin_campaign') : 'sin_campaign';
                if (!isset($campaignStats[$cKey])) {
                    $campaignStats[$cKey] = ['campaign_code' => $cKey, 'has_campaign' => $row['_has_campaign'], 'total' => 0, 'new' => 0, 'existing' => 0];
                }
                $campaignStats[$cKey]['total']++;
                if ($row['_status'] === 'new') $campaignStats[$cKey]['new']++;
                else $campaignStats[$cKey]['existing']++;
            }

            $withCampaign    = count(array_filter($allClassified, fn($r) => $r['_has_campaign']));
            $withoutCampaign = count(array_filter($allClassified, fn($r) => !$r['_has_campaign']));

            $response->data = [
                'summary' => [
                    'total_rows'       => count($allClassified),
                    'new_count'        => count($newRows),
                    'existing_count'   => count($existingRows),
                    'with_campaign'    => $withCampaign,
                    'without_campaign' => $withoutCampaign,
                    'campaigns_found'  => $existingCampaigns->count(),
                    'new_campaigns'    => max(0, count($campaignCodes) - $existingCampaigns->count()),
                ],
                'campaign_breakdown' => array_values($campaignStats),
                'sample_new'      => array_slice($newRows,      0, 10),
                'sample_existing' => array_slice($existingRows, 0, 20),
            ];
        });

        return response($response->toArray(), $response->status);
    }

    public function import(Request $request)
    {

        DB::beginTransaction();
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {
            $file = $request->file('file');
            $mapping = json_decode($request->mapping, true);

            $readerType = MaatwebsiteExcel::XLSX;
            $extension = strtolower($file->getClientOriginalExtension());
            if ($extension === 'xls') {
                $readerType = MaatwebsiteExcel::XLS;
            } elseif ($extension === 'csv') {
                $readerType = MaatwebsiteExcel::CSV;
            }

            $rows = Excel::toArray([], $file->getRealPath(), null, $readerType)[0];

            // Extract headers
            $headers = array_shift($rows);

            // Build objects with headers as keys
            $cleanRows = [];
            foreach ($rows as $row) {
                $rowData = [];
                foreach ($headers as $index => $header) {
                    $rowData[$header] = $row[$index] ?? null;
                }

                // Check if row has any non-empty value
                if (collect($rowData)->filter(fn($v) => trim($v) !== '')->isNotEmpty()) {
                    $cleanRows[] = $rowData;
                }
            }

            $business_id = Auth::user()->business_id;

            // Build a map of campaign_code => existing campaign id
            $campaignIdColumn = $mapping['campaign_id'] ?? null;
            $campaignNameColumn = $mapping['campaign_name'] ?? null;

            // Helper: strip Meta export prefixes like ag:, ad:, adset: from a code
            $stripMetaPrefix = fn(string $v): string => trim(preg_replace('/^[a-z]+:/i', '', $v));

            $campaignCodes = [];
            if ($campaignIdColumn) {
                $campaignCodes = array_unique(array_filter(array_map(
                    fn($v) => $stripMetaPrefix((string)$v),
                    array_column($cleanRows, $campaignIdColumn)
                )));
            } elseif ($campaignNameColumn) {
                $campaignCodes = array_unique(array_filter(array_map(
                    fn($v) => $stripMetaPrefix((string)$v),
                    array_column($cleanRows, $campaignNameColumn)
                )));
            }

            $existingCampaigns = Campaign::where('business_id', $business_id)
                ->whereIn('code', $campaignCodes)
                ->pluck('id', 'code');

            // Collect new campaigns to insert
            $campaignsToInsert = [];
            foreach ($cleanRows as $row) {
                $adId = '';
                $adTitle = null;
                if ($campaignIdColumn) {
                    $adId = $stripMetaPrefix((string)($row[$campaignIdColumn] ?? ''));
                    if ($campaignNameColumn) {
                        $adTitle = $stripMetaPrefix((string)($row[$campaignNameColumn] ?? '')) ?: null;
                    }
                } elseif ($campaignNameColumn) {
                    $adId = $stripMetaPrefix((string)($row[$campaignNameColumn] ?? ''));
                    $adTitle = $adId ?: null;
                }

                // Skip if already in DB OR already queued for insertion
                if ($adId === '' || isset($existingCampaigns[$adId]) || isset($campaignsToInsert[$adId])) {
                    continue;
                }

                $source = strtolower($row[$mapping['source']] ?? '');
                $campaignsToInsert[$adId] = [
                    'id'          => Uuid::uuid1()->toString(),
                    'code'        => $adId,
                    'title'       => $adTitle,
                    'source'      => match ($source) {
                        'fb' => 'facebook',
                        'ig' => 'instagram',
                        default => $source ?: 'unknown',
                    },
                    'protected'   => true,
                    'business_id' => $business_id,
                    'created_at'  => now(),
                    'updated_at'  => now()
                ];
            }

            // Bulk insert new campaigns
            if (!empty($campaignsToInsert)) {
                Campaign::insert(array_values($campaignsToInsert));
                // Merge newly inserted campaigns into existing map
                foreach ($campaignsToInsert as $code => $campaign) {
                    $existingCampaigns[$code] = $campaign['id'];
                }
            }

            // Build final campaignMap for later use (code => full campaign data)
            $campaignMap = [];
            foreach ($existingCampaigns as $code => $id) {
                $campaignMap[$code] = [
                    'id'    => $id,
                    'code'  => $code,
                ];
            }
            // Map rows to desired format using mapping
            $mappedRows = [];
            foreach ($cleanRows as $row) {
                $phone = Text::keep($row[$mapping['phone']], '0123456789');
                if (strlen($phone) === 9 && str_starts_with($phone, '9')) {
                    $phone = '51' . $phone;
                }
                $mappingDate = Carbon::parse($row[$mapping['date']]);

                // Determine campaign_id
                $campaignId = null;
                $adId = null;
                if ($campaignIdColumn) {
                    $adId = $row[$campaignIdColumn] ?? null;
                } elseif ($campaignNameColumn) {
                    $adId = $row[$campaignNameColumn] ?? null;
                }
                // Strip Meta prefixes (ag:, ad:, adset:) from IDs
                if ($adId !== null) {
                    $adId = trim(preg_replace('/^[a-z]+:/i', '', $adId));
                }

                if ($adId !== null && trim($adId) !== '' && isset($campaignMap[$adId])) {
                    $campaignId = $campaignMap[$adId]['id'];
                }

                // Determine attribution and channels
                $originRaw = strtolower($row[$mapping['source']] ?? '');
                $origin = match ($originRaw) {
                    'fb', 'facebook' => 'Facebook',
                    'ig', 'instagram' => 'Instagram',
                    default => $row[$mapping['source']] ?? null,
                };

                $source = 'Importación';
                $triggeredBy = $row[$mapping['triggered_by']] ?? 'Importación';
                $sourceChannel = null;

                if ($origin === 'Facebook' || $origin === 'Instagram') {
                    $source = 'Meta';
                    $triggeredBy = 'Formulario ' . $origin;
                    $sourceChannel = $origin . ' Form';
                }

                $adsetColumn = $mapping['adset_name'] ?? null;
                $adColumn = $mapping['ad_name'] ?? null;

                // Strip Meta export prefixes like ag:, ad:, adset: from ad/adset names
                $adsetName = $adsetColumn ? trim(preg_replace('/^[a-z]+:/i', '', $row[$adsetColumn] ?? '')) ?: null : null;
                $adName    = $adColumn    ? trim(preg_replace('/^[a-z]+:/i', '', $row[$adColumn]    ?? '')) ?: null : null;

                $mapped = [
                    'id'     => Uuid::uuid1()->toString(),
                    'business_id' => $business_id,
                    'name' => $row[$mapping['name']] ?? null,
                    'contact_name'   => $row[$mapping['name']] ?? null,
                    'contact_email'  => $row[$mapping['email']] ?? null,
                    'contact_phone' => $phone ?: null,
                    'source' => $source,
                    'origin' => $origin,
                    'triggered_by' => $triggeredBy,
                    'source_channel' => $sourceChannel,
                    'adset_name' => $adsetName,
                    'ad_name' => $adName,
                    'status_id' => Setting::get('default-lead-status'),
                    'manage_status_id' => Setting::get('default-manage-lead-status'),
                    'campaign_id' => $campaignId,
                    'form_answers'   => [
                        [
                            'title'     => 'Formulario de meta',
                            'completed' => true,
                            'questions' => []
                        ]
                    ],
                    'complete_form' => true,
                    'complete_registration' => true,
                    'message' => 'Sin mensaje',
                    'ip' => $request->ip(),
                    'date' => isset($mapping['date']) && !empty($row[$mapping['date']])
                        ? $mappingDate->format('Y-m-d')
                        : now()->subHours(5)->format('Y-m-d'),
                    'time' => isset($mapping['date']) && !empty($row[$mapping['date']])
                        ? ($mappingDate->format('H:i:s') !== '00:00:00'
                            ? $mappingDate->format('H:i:s')
                            : '12:00:00')
                        : now()->subHours(5)->format('H:i:s'),
                    'created_at' => isset($mapping['date']) && !empty($row[$mapping['date']])
                        ? $mappingDate
                        : now(),
                    'updated_at' => now(),  // Siempre la fecha del import, no la del lead original
                    'status' => true,
                    'lead_origin' => $campaignId ? 'campaign' : 'import'
                ];

                // Build form answers array
                foreach ($mapping['form'] as $question) {
                    $mapped['form_answers'][0]['questions'][] = [
                        'text'    => $question,
                        'answer'  => $row[$question] ?? null,
                    ];
                }
                $mapped['form_answers'] = JSON::stringify($mapped['form_answers']);
                $mappedRows[] = $mapped;
            }

            $emails = array_filter(array_unique(array_map('strtolower', array_map('trim', array_column($mappedRows, 'contact_email')))));
            
            $phoneSuffixes = [];
            foreach ($mappedRows as $row) {
                if ($row['contact_phone']) {
                    $cleanPhone = preg_replace('/[^0-9]/', '', $row['contact_phone']);
                    $phoneSuffix = substr($cleanPhone, -9);
                    if (strlen($phoneSuffix) === 9) {
                        $phoneSuffixes[] = $phoneSuffix;
                    }
                }
            }
            $phoneSuffixes = array_unique($phoneSuffixes);

            if (empty($emails) && empty($phoneSuffixes)) {
                $existingClients = collect();
            } else {
                $existingClients = Client::where('business_id', $business_id)
                    ->where(function ($q) use ($emails, $phoneSuffixes) {
                        $hasCond = false;
                        if (!empty($emails)) {
                            $q->whereIn(DB::raw('LOWER(contact_email)'), $emails);
                            $hasCond = true;
                        }
                        if (!empty($phoneSuffixes)) {
                            $suffixesString = implode("','", array_map('addslashes', $phoneSuffixes));
                            if ($hasCond) {
                                $q->orWhereRaw("RIGHT(REGEXP_REPLACE(contact_phone, '[^0-9]', ''), 9) IN ('{$suffixesString}')");
                            } else {
                                $q->whereRaw("RIGHT(REGEXP_REPLACE(contact_phone, '[^0-9]', ''), 9) IN ('{$suffixesString}')");
                            }
                        }
                    })
                    ->get();
            }

            $rowsToInsert = [];
            $rowsToUpdate = [];

            foreach ($mappedRows as $row) {
                $rowEmail = $row['contact_email'] ? strtolower(trim($row['contact_email'])) : null;
                $rowPhoneClean = preg_replace('/[^0-9]/', '', $row['contact_phone'] ?? '');
                $rowPhoneSuffix = substr($rowPhoneClean, -9);

                $existing = $existingClients->first(function ($client) use ($rowEmail, $rowPhoneSuffix) {
                    if ($rowEmail && strtolower(trim($client->contact_email)) === $rowEmail) {
                        return true;
                    }
                    if (strlen($rowPhoneSuffix) === 9) {
                        $clientPhoneClean = preg_replace('/[^0-9]/', '', $client->contact_phone ?? '');
                        $clientPhoneSuffix = substr($clientPhoneClean, -9);
                        if (strlen($clientPhoneSuffix) === 9 && $clientPhoneSuffix === $rowPhoneSuffix) {
                            return true;
                        }
                    }
                    return false;
                });

                if ($existing) {
                    $rowsToUpdate[] = [
                        'client' => $existing,
                        'data'   => $row
                    ];
                } else {
                    $rowsToInsert[] = $row;
                }
            }

            \Illuminate\Support\Facades\Log::info('Import matching details:', [
                'emails_to_match' => $emails,
                'phone_suffixes_to_match' => $phoneSuffixes,
                'found_matches_count' => $existingClients->count(),
                'rows_to_insert_count' => count($rowsToInsert),
                'rows_to_update_count' => count($rowsToUpdate)
            ]);

            Client::withoutEvents(function () use ($rowsToInsert, $rowsToUpdate, $business_id) {
                // 1. Procesar leads nuevos
                if (!empty($rowsToInsert)) {
                    Client::insert(array_values($rowsToInsert));

                    $notesToInsert = [];
                    $tasksToInsert = [];
                    $newLeadMessageTemplate = Setting::get('whatsapp-new-lead-notification-message', $business_id);

                    foreach ($rowsToInsert as $row) {
                        $formString = '';
                        $forms = JSON::parse((string) $row['form_answers']);
                        foreach ($forms as $form) {
                            $formString .= "<b>{$form['title']}</b><br>";
                            foreach ($form['questions'] as $index => $question) {
                                $formString .= ($index + 1) . ". {$question['text']}<br>&emsp;{$question['answer']}<br>";
                            }
                            $formString .= '<br>';
                        }

                        // 1.1. Nota de Respuestas de Formulario
                        $notesToInsert[] = [
                            'id' => Uuid::uuid1()->toString(),
                            'note_type_id' => '8e895346-3d87-4a87-897a-4192b917c211',
                            'client_id' => $row['id'],
                            'name' => 'Formulario ' . $row['source'],
                            'description' => $formString,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];

                        // 1.2. Nota de "Lead nuevo"
                        $newLeadNoteId = Uuid::uuid1()->toString();
                        $description = UtilController::replaceData($newLeadMessageTemplate, $row);
                        $notesToInsert[] = [
                            'id' => $newLeadNoteId,
                            'note_type_id' => '8e895346-3d87-4a87-897a-4192b917c211',
                            'client_id' => $row['id'],
                            'name' => 'Lead nuevo',
                            'description' => $description,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];

                        // 1.3. Tarea de "Revisar lead"
                        $tasksToInsert[] = [
                            'id' => Uuid::uuid1()->toString(),
                            'model_id' => ClientNote::class,
                            'note_id' => $newLeadNoteId,
                            'name' => 'Revisar lead',
                            'description' => 'Debes revisar los requerimientos del lead',
                            'ends_at' => Carbon::now()->addDay()->format('Y-m-d H:i:s'),
                            'status' => 'Pendiente',
                            'asignable' => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }

                    if (!empty($notesToInsert)) {
                        ClientNote::insert($notesToInsert);
                    }
                    if (!empty($tasksToInsert)) {
                        Task::insert($tasksToInsert);
                    }

                    // 1.4. Crear ClientEntry por cada lead nuevo (fuente de verdad para KPIs e iconos)
                    $entriesToInsert = [];
                    foreach ($rowsToInsert as $row) {
                        $entriesToInsert[] = [
                            'id'             => Uuid::uuid1()->toString(),
                            'client_id'      => $row['id'],
                            'campaign_id'    => $row['campaign_id'] ?? null,
                            'adset_name'     => $row['adset_name'] ?? null,
                            'ad_name'        => $row['ad_name'] ?? null,
                            'source'         => $row['source'] ?? null,
                            'origin'         => $row['origin'] ?? null,
                            'lead_origin'    => $row['lead_origin'] ?? null,
                            'triggered_by'   => $row['triggered_by'] ?? null,
                            'source_channel' => $row['source_channel'] ?? null,
                            'entry_date'     => $row['created_at'],
                            'created_at'     => now(),
                            'updated_at'     => now(),
                        ];
                    }
                    if (!empty($entriesToInsert)) {
                        \App\Models\ClientEntry::insert($entriesToInsert);
                    }
                }

                // 2. Procesar leads existentes (actualización de datos vacíos, reactivación de Kanban y registro omnicanal)
                foreach ($rowsToUpdate as $item) {
                    $client = $item['client'];
                    $row = $item['data'];

                    // No sobreescribir el estado del cliente existente (mantiene su etapa actual: En gestión, Contactado, etc.)
                    $updateData = [
                        'complete_registration' => true,
                    ];

                    // Rellenar únicamente campos vacíos (no sobreescribir datos originales de atribución)
                    if ($row['contact_email'] && !$client->contact_email) {
                        $updateData['contact_email'] = $row['contact_email'];
                    }
                    if ($row['contact_phone'] && !$client->contact_phone) {
                        $updateData['contact_phone'] = $row['contact_phone'];
                    }
                    if ($row['contact_name'] && (!$client->contact_name || $client->contact_name == $client->contact_phone)) {
                        $updateData['contact_name'] = $row['contact_name'];
                        $updateData['name'] = $row['contact_name'];
                    }
                    $client->update($updateData);

                    // Evitar duplicar entradas del mismo origen/campaña/anuncio para este cliente
                    $entryExists = \App\Models\ClientEntry::where('client_id', $client->id)
                        ->where('campaign_id', $row['campaign_id'] ?? null)
                        ->where('ad_name', $row['ad_name'] ?? null)
                        ->where('adset_name', $row['adset_name'] ?? null)
                        ->where('source', $row['source'] ?? null)
                        ->where('origin', $row['origin'] ?? null)
                        ->exists();

                    if (!$entryExists) {
                        // Registrar la entrada en client_entries
                        \App\Models\ClientEntry::create([
                            'client_id'      => $client->id,
                            'campaign_id'    => $row['campaign_id'] ?? null,
                            'adset_name'     => $row['adset_name'] ?? null,
                            'ad_name'        => $row['ad_name'] ?? null,
                            'source'         => $row['source'] ?? null,
                            'origin'         => $row['origin'] ?? null,
                            'lead_origin'    => $row['lead_origin'] ?? null,
                            'triggered_by'   => $row['triggered_by'] ?? null,
                            'source_channel' => $row['source_channel'] ?? null,
                            'entry_date'     => $row['created_at'],
                        ]);

                        // Generar nota de re-registro con sus respuestas del formulario
                        $formString = "<b>¡El cliente volvió a registrarse! (Nueva entrada por Importación)</b><br>";
                        $formString .= "• Origen: Importación ({$row['source']})<br>";
                        if ($row['ad_name']) {
                            $formString .= "• Anuncio: {$row['ad_name']}<br>";
                        }
                        $formString .= "• Datos ingresados: Nombre: {$row['name']} | Teléfono: {$row['contact_phone']} | Email: {$row['contact_email']}<br><br>";

                        $forms = JSON::parse((string) $row['form_answers']);
                        foreach ($forms as $form) {
                            $formString .= "<b>{$form['title']}</b><br>";
                            foreach ($form['questions'] as $index => $question) {
                                $formString .= ($index + 1) . ". {$question['text']}<br>&emsp;{$question['answer']}<br>";
                            }
                            $formString .= '<br>';
                        }

                        ClientNote::create([
                            'note_type_id' => '8e895346-3d87-4a87-897a-4192b917c211',
                            'client_id' => $client->id,
                            'name' => 'Re-registro por Importación',
                            'description' => $formString,
                        ]);
                    }
                }
            });

            // Guardar conteos finales en la respuesta
            $response->data = [
                'created' => count($rowsToInsert),
                'updated' => count($rowsToUpdate)
            ];

            DB::commit();
        }, function ($response, $th) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error($th);
        });

        return response($response->toArray(), $response->status);
    }

    public function syncMetaLeads(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            $leads = $request->all();
            if (empty($leads)) {
                $leads = json_decode($request->getContent(), true);
            }
            
            \Illuminate\Support\Facades\Log::info('Contenido recibido en syncMetaLeads: ' . json_encode($leads));
            
            if (!$leads || !is_array($leads)) {
                \Illuminate\Support\Facades\Log::error('Error en sincronización Meta: JSON inválido o vacío. Contenido recibido: ' . substr($request->getContent(), 0, 500));
                throw new Exception('El JSON proporcionado no es válido o está vacío.');
            }
            
            \Illuminate\Support\Facades\Log::info('Iniciando sincronización Meta: ' . count($leads) . ' leads recibidos.');
            
            $business_id = Auth::user()->business_id;
            $updatedCount = 0;

            foreach ($leads as $leadData) {
                $email = $leadData['email'] ?? null;
                if (!$email) {
                    \Illuminate\Support\Facades\Log::warning('Lead sin email ignorado en sincronización.');
                    continue;
                }

                $clients = Client::where('business_id', $business_id)
                    ->where(DB::raw('LOWER(contact_email)'), strtolower($email))
                    ->get();

                $platformCode = strtolower($leadData['platform'] ?? 'fb');
                $platformName = $platformCode == 'ig' ? 'Instagram' : 'Facebook';
                
                // Sync campaign
                $campaignId = null;
                $rawCampaignId = $leadData['campaign_id'] ?? null;
                $cleanCampaignId = $rawCampaignId ? trim(preg_replace('/^[a-z]+:/i', '', $rawCampaignId)) : null;
                
                if ($cleanCampaignId) {
                    $campaign = Campaign::updateOrCreate([
                        'business_id' => $business_id,
                        'code' => $cleanCampaignId
                    ], [
                        'title' => $leadData['campaign_name'] ?? 'Campaña Meta',
                        'source' => strtolower($leadData['platform'] ?? 'fb') == 'ig' ? 'instagram' : 'facebook'
                    ]);
                    $campaignId = $campaign->id;
                }

                if ($clients->isEmpty()) {
                    // Create new lead if it doesn't exist
                    \Illuminate\Support\Facades\Log::info("Creando nuevo lead para email: {$email}");
                    $client = Client::create([
                        'business_id' => $business_id,
                        'contact_email' => $email,
                        'contact_name' => $leadData['full_name'] ?? 'Sin nombre',
                        'name' => $leadData['full_name'] ?? 'Sin nombre',
                        'contact_phone' => preg_replace('/[^0-9]/', '', $leadData['phone_number'] ?? ''),
                        'source' => 'Meta',
                        'origin' => $platformName,
                        'lead_origin' => $platformName,
                        'triggered_by' => "Formulario {$platformName}",
                        'source_channel' => "{$platformName} Form",
                        'campaign_id' => $campaignId,
                        'adset_name' => $leadData['adset_name'] ?? null,
                        'ad_name' => $leadData['ad_name'] ?? null,
                        'status_id' => Setting::get('default-lead-status', $business_id),
                        'manage_status_id' => Setting::get('default-manage-lead-status', $business_id),
                        'message' => 'Lead sincronizado desde Meta',
                        'date' => now()->format('Y-m-d'),
                        'time' => now()->format('H:i:s'),
                        'ip' => $request->ip() ?? '127.0.0.1',
                        'complete_registration' => true,
                        'status' => true
                    ]);
                    $updatedCount++;
                } else {
                    // Update all existing leads with this email
                    foreach ($clients as $client) {
                        \Illuminate\Support\Facades\Log::info("Actualizando cliente ID {$client->id} ({$email})");
                        $client->origin = $platformName;
                        $client->lead_origin = $platformName;
                        $client->source = 'Meta';
                        $client->triggered_by = "Formulario {$platformName}";
                        $client->adset_name = $leadData['adset_name'] ?? $client->adset_name;
                        $client->ad_name = $leadData['ad_name'] ?? $client->ad_name;
                        $client->source_channel = "{$platformName} Form";
                        $client->campaign_id = $campaignId ?? $client->campaign_id;
                        $client->save();
                        $updatedCount++;
                    }
                }
            }
            return "Se han sincronizado {$updatedCount} leads correctamente.";
        });

        return response($response->toArray(), $response->status);
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $exists = Client::query()
            ->where('business_id', Auth::user()->business_id)
            ->where('id', $request->id)->exists();
        if (!$exists) {
            $status = Setting::get('default-lead-status');
            $manage_status = Setting::get('default-manage-lead-status');
            $body['status_id'] = $status;
            $body['manage_status_id'] = $manage_status;
            $body['created_by'] = Auth::user()->service_user->id;
            $body['source'] = env('APP_NAME');
            $body['origin'] = env('APP_NAME');
            $body['triggered_by'] = 'Formulario';
            $body['date'] = Trace::getDate('date');
            $body['time'] = Trace::getDate('time');
            $body['ip'] = $request->ip();
            $body['complete_registration'] = true;
            $body['status'] = true;
        }

        return $body;
    }

    public function afterSave(Request $request, object $jpa, ?bool $isNew)
    {
        if (!$isNew) {
            ClientNote::create([
                'client_id' => $jpa->id,
                'name' => Auth::user()->name . ' actualizo datos del lead',
            ]);
            $newJpa = Client::with(['status', 'assigned', 'manageStatus', 'creator'])
                ->where('id', $jpa->id)
                ->first();
            return $newJpa;
        }
        $noteJpa = ClientNote::create([
            'note_type_id' => '8e895346-3d87-4a87-897a-4192b917c211',
            'client_id' => $jpa->id,
            'name' => 'Lead nuevo',
            'description' => UtilController::replaceData(
                Setting::get('whatsapp-new-lead-notification-message', $jpa->business_id),
                $jpa->toArray()
            )
        ]);

        Task::create([
            'model_id' => ClientNote::class,
            'note_id' => $noteJpa->id,
            'name' => 'Revisar lead',
            'description' => 'Debes revisar los requerimientos del lead',
            'ends_at' => Carbon::now()->addDay()->format('Y-m-d H:i:s'),
            'status' => 'Pendiente',
            'asignable' => true
        ]);

        // Registrar entrada inicial en client_entries para nuevos leads creados
        \App\Models\ClientEntry::create([
            'client_id'      => $jpa->id,
            'campaign_id'    => $jpa->campaign_id ?? null,
            'adset_name'     => $jpa->adset_name ?? null,
            'ad_name'        => $jpa->ad_name ?? null,
            'source'         => $jpa->source ?? 'Meta',
            'origin'         => $jpa->origin ?? 'Facebook',
            'lead_origin'    => $jpa->lead_origin ?? 'integration',
            'triggered_by'   => $jpa->triggered_by ?? 'API',
            'source_channel' => $jpa->source_channel ?? null,
            'entry_date'     => $jpa->created_at ?? now(),
        ]);

        // if ($jpa->created_by) {
        //     SaveNotification::dispatchAfterResponse([
        //         'name' => 'Nuevo lead',
        //         'message' =>  Auth::user()->service_user->fullname . ' ha creado un nuevo lead.',
        //         'module' => 'Leads',
        //         'link_to' => '/leads/' . $jpa->id,
        //         'created_by' => Auth::user()->service_user->id,
        //         'business_id' => $jpa->business_id
        //     ]);
        // } else {
        //     SaveNotification::dispatchAfterResponse([
        //         'icon' => 'fas fa-user-plus',
        //         'name' => 'Nuevo lead',
        //         'message' =>  'Se ha registrado un nuevo lead desde ' . $jpa->origin,
        //         'module' => 'Leads',
        //         'link_to' => '/leads/' . $jpa->id,
        //         'business_id' => $jpa->business_id
        //     ]);
        // }

        $newJpa = Client::with(['status', 'assigned', 'manageStatus', 'chatStatus', 'creator'])
            ->where('id', $jpa->id)
            ->first();

        return $newJpa;
    }

    public function all(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {
            $clients = Client::select('clients.*')
                ->withCount(['notes', 'tasks', 'pendingTasks'])
                ->with(['status', 'assigned', 'manageStatus', 'chatStatus'])
                ->join('statuses AS status', 'status.id', 'status_id')
                ->where('status.table_id', 'e05a43e5-b3a6-46ce-8d1f-381a73498f33')
                ->where('clients.business_id', Auth::user()->business_id)
                ->where('clients.status', true)
                ->get();
            $response->data = $clients;
        });
        return response($response->toArray(), $response->status);
    }

    public function byStatus(Request $request, string $status)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request, $status) {
            $clients = Client::withCount('notes')
                ->where('status_id', $status)
                ->where('business_id', Auth::user()->business_id)
                ->get();
            $response->data = $clients;
        });
        return response($response->toArray(), $response->status);
    }

    public function leadStatus(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('LeadController::leadStatus - INICIO', [
            'request_all' => $request->all(),
            'default_client_status' => Setting::get('default-client-status'),
            'converted_lead_status' => Setting::get('converted-lead-status')
        ]);

        $response = Response::simpleTryCatch(function (Response $response) use ($request) {
            $leadJpa = Client::find($request->lead);
            if (!$leadJpa) {
                \Illuminate\Support\Facades\Log::warning('LeadController::leadStatus - Lead no encontrado', ['id' => $request->lead]);
                throw new Exception('Lead no encontrado');
            }
            if ($leadJpa->business_id != Auth::user()->business_id) throw new Exception('Este lead no pertenece a tu empresa');
            
            $oldStatus = $leadJpa->status_id;
            $leadJpa->status_id = $request->status;

            \Illuminate\Support\Facades\Log::info('LeadController::leadStatus - Actualizando estado', [
                'old_status' => $oldStatus,
                'new_status' => $request->status,
                'matches_default_client' => ($request->status == Setting::get('default-client-status'))
            ]);

            if ($request->ruc) $leadJpa->ruc = $request->ruc;
            if ($request->tradename) {
                $leadJpa->tradename = $request->tradename;
                $leadJpa->name = $request->tradename;
            }
            if ($request->fullname) $leadJpa->contact_name = $request->fullname;

            try {
                $assignationStatus = JSON::parse(Setting::get('assignation-lead-status') ?? '{}');
                $revertionStatus = JSON::parse(Setting::get('revertion-lead-status') ?? '{}');

                if ($leadJpa->status_id == ($assignationStatus['lead'] ?? '')) StatusController::updateStatus4Lead($leadJpa, true);
                if ($leadJpa->status_id == ($revertionStatus['lead'] ?? '')) StatusController::updateStatus4Lead($leadJpa, false);
            } catch (\Throwable $th) {
                \Illuminate\Support\Facades\Log::error('LeadController::leadStatus - Error en StatusController', ['error' => $th->getMessage()]);
            }

            $leadJpa->save();

            if ($request->createProject && $request->projectData) {
                \Illuminate\Support\Facades\Log::info('LeadController::leadStatus - Creando proyecto manual');
                $projectData = $request->projectData;
                $cost = $projectData['cost'] ?? 0;
                Project::create([
                    'id' => Uuid::uuid1()->toString(),
                    'client_id' => $leadJpa->id,
                    'name' => $projectData['name'],
                    'type_id' => $projectData['type_id'],
                    'description' => 'Proyecto generado al convertir lead',
                    'cost' => $cost,
                    'remaining_amount' => $cost,
                    'business_id' => $leadJpa->business_id,
                    'starts_at' => $projectData['starts_at'],
                    'ends_at' => $projectData['ends_at'],
                    'signed_at' => $projectData['signed_at'] ?? null,
                    'status_id' => Setting::get('default-project-status') ?? Status::where('table_id', 'cd8bd48f-c73c-4a62-9935-024139f3be5f')->where('business_id', $leadJpa->business_id)->where('status', true)->first()?->id,
                ]);
            } else if ($leadJpa->status_id == Setting::get('default-client-status')) {
                \Illuminate\Support\Facades\Log::info('LeadController::leadStatus - Intentando conversion automatica');
                $product = $leadJpa->products()->first();
                if ($product) {
                    $projectExists = Project::where('client_id', $leadJpa->id)->exists();
                    if (!$projectExists) {
                        $cost = $product->pivot->price ?? $product->price ?? 0;
                        Project::create([
                            'id' => Uuid::uuid1()->toString(),
                            'client_id' => $leadJpa->id,
                            'name' => ($product->name ?? 'Servicio') . ' - ' . ($leadJpa->tradename ?: $leadJpa->contact_name),
                            'description' => 'Proyecto generado automáticamente al convertir lead',
                            'cost' => $cost,
                            'remaining_amount' => $cost,
                            'business_id' => $leadJpa->business_id,
                            'status_id' => Setting::get('default-project-status') ?? Status::where('table_id', 'cd8bd48f-c73c-4a62-9935-024139f3be5f')->where('business_id', $leadJpa->business_id)->where('status', true)->first()?->id,
                        ]);
                    }
                } else {
                    \Illuminate\Support\Facades\Log::info('LeadController::leadStatus - No hay productos para crear proyecto automatico');
                }
            }
            return $leadJpa->load(['status', 'assigned', 'manageStatus', 'chatStatus', 'creator']);
        });
        return response($response->toArray(), $response->status);
    }

    public function manageStatus(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('LeadController::manageStatus - INICIO', [
            'request_all' => $request->all(),
            'converted_lead_status' => Setting::get('converted-lead-status')
        ]);

        $response = Response::simpleTryCatch(function (Response $response) use ($request) {
            $leadJpa = Client::find($request->lead);
            if (!$leadJpa) {
                \Illuminate\Support\Facades\Log::warning('LeadController::manageStatus - Lead no encontrado', ['id' => $request->lead]);
                throw new Exception('Lead no encontrado');
            }
            if ($leadJpa->business_id != Auth::user()->business_id) throw new Exception('Este lead no pertenece a tu empresa');
            
            $oldManageStatus = $leadJpa->manage_status_id;
            $leadJpa->manage_status_id = $request->status;
            
            \Illuminate\Support\Facades\Log::info('LeadController::manageStatus - Actualizando etiqueta', [
                'old_manage_status' => $oldManageStatus,
                'new_manage_status' => $request->status,
                'is_conversion_status' => ($request->status == Setting::get('converted-lead-status'))
            ]);

            try {
                $assignationStatus = JSON::parse(Setting::get('assignation-lead-status') ?? '{}');
                $revertionStatus = JSON::parse(Setting::get('revertion-lead-status') ?? '{}');

                if ($leadJpa->manage_status_id == ($assignationStatus['manage'] ?? '')) StatusController::updateStatus4Lead($leadJpa, true);
                if ($leadJpa->manage_status_id == ($revertionStatus['manage'] ?? '')) StatusController::updateStatus4Lead($leadJpa, false);
            } catch (\Throwable $th) {
                \Illuminate\Support\Facades\Log::error('LeadController::manageStatus - Error en StatusController', ['error' => $th->getMessage()]);
            }

            try {
                $archivedLeadStatusDirect = JSON::parseable(Setting::get('archived-lead-status-direct') ?? '[]') ?? [];
                if ($archivedLeadStatusDirect && count($archivedLeadStatusDirect) > 0) {
                    if (in_array($leadJpa->manage_status_id, $archivedLeadStatusDirect)) {
                        $leadJpa->status = null;
                    }
                }
            } catch (\Throwable $th) {
            }

            $leadJpa->save();
            return $leadJpa->load(['status', 'assigned', 'manageStatus', 'chatStatus', 'creator']);
        });
        return response($response->toArray(), $response->status);
    }

    public function chatStatus(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {
            $leadJpa = Client::find($request->lead);
            if (!$leadJpa) {
                throw new Exception('Lead no encontrado');
            }
            if ($leadJpa->business_id != Auth::user()->business_id) throw new Exception('Este lead no pertenece a tu empresa');
            
            $leadJpa->chat_status_id = $request->status;
            $leadJpa->save();
            
            return $leadJpa->load(['status', 'assigned', 'manageStatus', 'chatStatus', 'creator']);
        });
        return response($response->toArray(), $response->status);
    }

    public function togglePin(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {
            $leadJpa = Client::find($request->lead);
            if (!$leadJpa) {
                throw new Exception('Lead no encontrado');
            }
            if ($leadJpa->business_id != Auth::user()->business_id) throw new Exception('Este lead no pertenece a tu empresa');
            
            $leadJpa->is_pinned = $request->is_pinned;
            $leadJpa->save();
            
            return $leadJpa->load(['status', 'assigned', 'manageStatus', 'chatStatus', 'creator']);
        });
        return response($response->toArray(), $response->status);
    }

    public function massiveAssign(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {
            $leadsIds = $request->leadsId;
            $userId = $request->userId;

            foreach ($leadsIds as $leadId) {
                $leadJpa = Client::find($leadId);
                if ($leadJpa->business_id != Auth::user()->business_id) {
                    throw new Exception('Uno o más leads no pertenecen a tu empresa');
                }
                // Update lead status using StatusController
                StatusController::updateStatus4Lead($leadJpa, $userId ? true : false, $userId);
                $leadJpa->save();
            }

            $userName = Auth::user()->name;
            $leadsCount = count($leadsIds);
            EventController::notify('notification', "{$userName} te ha asignado {$leadsCount} leads nuevos", [
                'business_id' => Auth::user()->business_id,
                'user_id' => $userId
            ]);

            $response->message = 'Leads asignados exitosamente';
        });
        return response($response->toArray(), $response->status);
    }

    public function attend(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {
            $leadJpa = Client::find($request->lead);
            if ($leadJpa->business_id != Auth::user()->business_id) throw new Exception('Este lead no pertenece a tu empresa');
            $leadJpa->complete_registration = true;
            if ($leadJpa->form_answers) $leadJpa->complete_form = true;
            StatusController::updateStatus4Lead($leadJpa, $request->method() != 'DELETE');

            $leadJpa->save();
        });
        return response($response->toArray(), $response->status);
    }

    public function external(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {

            $authorizationHeader = $request->header('Authorization');

            if (Text::nullOrEmpty($authorizationHeader)) {
                throw new Exception("Debe enviar los parámetros de autenticación 'Authorization'");
            }

            if (!Text::startsWith($authorizationHeader, 'Bearer ')) {
                throw new Exception("El token de autorización debe ser de tipo Bearer");
            }

            $uuid = \str_replace('Bearer ', '', $authorizationHeader);
            $uuid = \str_replace('bearer ', '', $uuid);
            $uuid = \str_replace('atalaya-', '', $uuid);

            $businessJpa = Business::select('id')->where('uuid', $uuid)->first();
            if (!$businessJpa) {
                throw new Exception("Empresa no encontrada para el token proporcionado");
            }

            $messages = [
                'contact_name.required' => 'El nombre de contacto es obligatorio.',
                'contact_phone.required' => 'El teléfono de contacto es obligatorio.',
                'contact_phone.max' => 'El teléfono de contacto no debe exceder los 15 caracteres.',
                'contact_email.required' => 'El correo electrónico es obligatorio.',
                'contact_email.email' => 'El correo electrónico debe tener el formato user@domain.com.',
                'contact_email.max' => 'El correo electrónico no debe exceder los 320 caracteres.',
                'contact_position.string' => 'La posición de contacto debe ser una cadena de texto.',
                // 'tradename.required' => 'El nombre comercial es obligatorio.',
                // 'tradename.string' => 'El nombre comercial debe ser una cadena de texto.',
                'message.required' => 'El mensaje es obligatorio.',
                'message.string' => 'El mensaje debe ser una cadena de texto.',
                'origin.required' => 'El origen es obligatorio.',
                'origin.string' => 'El origen debe ser una cadena de texto.'
            ];

            $validatedData = $request->validate([
                'contact_name' => 'required|string',
                'contact_phone' => 'required|max:15',
                'contact_email' => 'required|email|max:320',
                'contact_position' => 'nullable|string',
                // 'tradename' => 'required|string',
                'workers' => 'nullable|string',
                'source' => 'nullable|string',
                'message' => 'required|string',
                'origin' => 'required|string',
                'triggered_by' => 'nullable|string'
            ], $messages);

            $validatedData['business_id'] = $businessJpa->id;
            $validatedData['name'] = $validatedData['contact_name'];
            $validatedData['source'] = $validatedData['source'] ?? 'Externo';
            $validatedData['date'] = Trace::getDate('date');
            $validatedData['time'] = Trace::getDate('time');
            $validatedData['ip'] = $request->ip();
            $validatedData['status_id'] = Setting::get('default-lead-status', $businessJpa->id);
            $validatedData['manage_status_id'] = Setting::get('default-manage-lead-status', $businessJpa->id);
            $validatedData['complete_registration'] = true;
            $validatedData['lead_origin'] = 'integration';

            if ($validatedData['origin'] == 'WhatsApp') {
                $leadJpa = Client::updateOrCreate([
                    'contact_phone' => $validatedData['contact_phone'],
                    'complete_registration' => false,
                    'status' => true
                ], $validatedData);
            } else {
                $leadJpa = Client::create($validatedData);
            }

            $this->afterSave($request, $leadJpa, true);

            SendNewLeadNotification::dispatchAfterResponse($leadJpa, $businessJpa);

            $response->message = 'Se ha creado el lead correctamente';
        });
        return response($response->toArray(), $response->status);
    }

    public function deleteChat(Request $request, string $lead)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($lead) {
            $client = Client::find($lead);
            if (!$client) throw new Exception('Lead no encontrado');
            if ($client->business_id != Auth::user()->business_id) {
                throw new Exception('No tienes permisos para realizar esta acción');
            }

            // Resetear campos de chat
            $client->last_message = null;
            $client->last_message_microtime = null;
            $client->save();

            // Eliminar mensajes asociados de la tabla 'messages'
            DB::table('messages')
                ->where('business_id', $client->business_id)
                ->where(function ($q) use ($client) {
                    $q->where('wa_id', $client->contact_phone);
                    if ($client->integration_user_id) {
                        $q->orWhere('wa_id', $client->integration_user_id);
                    }
                })
                ->delete();

            // Notificar cambios en tiempo real
            try {
                $clientJpa = Client::with(['assigned', 'status', 'manageStatus', 'chatStatus', 'integration'])
                    ->withCount(['unSeenMessages'])
                    ->find($client->id);
                if ($clientJpa) {
                    \App\Http\Controllers\EventController::notify('client.updated', $clientJpa->toArray(), ['business_id' => $client->business_id]);
                    \App\Http\Controllers\EventController::notify('client.updated.menu', $clientJpa->toArray(), ['business_id' => $client->business_id]);
                }
            } catch (\Throwable $th) {
                // Silenciar errores de broadcast
            }
        });
        return response($response->toArray(), $response->status);
    }

    public function delete(Request $request, string $id)
    {
        $response = new Response();
        try {
            $leadJpa = Client::find($id);
            $deleted = $this->softDeletion
                ? $this->model::where('id', $id)
                ->update(['status' => null])
                : $this->model::where('id', $id)
                ->delete();

            if (!$deleted) throw new Exception('No se ha eliminado ningun registro');

            try {
                if ($leadJpa->integration_id) {
                    Message::where('business_id', Auth::user()->business_id)
                        ->where('wa_id', $leadJpa->integration_user_id)->delete();
                } else {
                    Message::where('business_id', Auth::user()->business_id)
                        ->where('wa_id', $leadJpa->contact_phone)->delete();
                }
            } catch (\Throwable $th) {
            }

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response(
                $response->toArray(),
                $response->status
            );
        }
    }
}
