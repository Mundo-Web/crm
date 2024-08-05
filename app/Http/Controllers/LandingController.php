<?php

namespace App\Http\Controllers;

use App\Http\Classes\EmailConfig;
use App\Models\Atalaya\Business;
use App\Models\Client;
use SoDe\Extend\Fetch;
use SoDe\Extend\Text;

class LandingController extends Controller
{
    static function envioCorreo(Client $client, Business $business)
    {

        $name = $client['contact_name'];
        $mail = EmailConfig::config($name); /* variable $name que se agregó */
        try {
            $html =
                '
            <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>Mundo web</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
                    <link
                        href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap"
                        rel="stylesheet"
                    />
                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }

                        @font-face {
                            font-family: grotesk;
                            src: url(../../public/fonts/PPRightGroteskCompactMedium.woff);
                            font-weight: normal;
                        }
                    </style>
                </head>
                <body>
                    <main>
                        <table
                            style="
                                width: 600px;
                                margin: 0 auto;
                                text-align: center;
                                background-image: url(https://mundoweb.pe/mail/Fondo.png);
                                background-repeat: no-repeat;
                                background-position: center;
                                background-size: cover;
                            "
                        >
                            <thead>
                                <tr>
                                    <th
                                        style="
                                            display: flex;
                                            flex-direction: row;
                                            justify-content: center;
                                            align-items: center;
                                            margin: 100px;
                                        "
                                    >
                                        <img src="https://mundoweb.pe/mail/Frame_14466.png" alt="mundo web" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <p
                                            style="
                                            color: #050a41;
                                            font-weight: 500;
                                            font-size: 18px;
                                            text-align: center;
                                            width: 500px;
                                            margin: 0 auto;
                                            padding: 20px 0;
                                            font-family: Montserrat, sans-serif;
                                        "
                                        >
                                             <span style="display:block">Hola </span>
                                            
                                            
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <p
                                            style="
                                                color: #e15a29;
                                                font-size: 40px;
                                                line-height: 40px;
                                                font-family: Montserrat, sans-serif;
                                            "
                                        >
                                             <span style="display:block">' . $name . ' </span>
                                            
                                            
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <p
                                            style="
                                                color: #e15a29;
                                                font-size: 40px;
                                                line-height: 70px;
                                                font-family: Montserrat, sans-serif;
                                            "
                                        >
                                            ¡Gracias
                                            <span style="color: #050a41"
                                                >por escribirnos! 🚀</span
                                            >
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <p
                                            style="
                                                color: #050a41;
                                                font-weight: 500;
                                                font-size: 18px;
                                                text-align: center;
                                                width: 500px;
                                                margin: 0 auto;
                                                padding: 20px 0;
                                                font-family: Montserrat, sans-serif;
                                            "
                                        >
                                        
                                            En breve nuestra ejecutiva comercial se estará comunicando contigo.
                                        </p>
                                    </td>
                                </tr>
            <tr>
            <td>
                <a href="https://mundoweb.pe/" style="
                    text-decoration: none;
                    background-color: #e15a29;
                    color: white;
                    border-radius: 40px;
                    padding: 12px 20px;
                    display: inline-flex;
                    justify-content: center;
                    align-items: center;
                    gap: 10px;
                    font-weight: 600;
                    font-family: Montserrat, sans-serif;
                ">
                    <span>Haz que tu negocio despegue</span>
                    <img  src="https://mundoweb.pe/mail/buttonmailing.png" style="
                        width: 20px;
                        margin-left: 15px;
                        height: 20px;
                    " />
                </a>
            </td>
        </tr>
        <tr>
            <td style="text-align: right; padding-right: 30px;">
                <img src="https://mundoweb.pe/mail/10_rgb.png" alt="mundo web" style="width: 80%; margin-top: 100px" />
            </td>
        </tr>
            </tbody>
            </table>
            </main>
            </body>

            </html>
            ';
            $mail->addAddress($client['contact_email']);
            $mail->Body = $html;
            $mail->isHTML(true);
            $mail->send();

            new Fetch(env('WA_URL') . '/api/send', [
                'method' => 'POST',
                'headers' => [
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json'
                ],
                'body' => [
                    'from' => 'atalaya-' . $business->uuid,
                    'to' => [
                        $client['country_prefix'] . $client['contact_phone']
                    ],
                    'html' => $html
                ]
            ]);

            sleep(5);

            $message = SettingController::get('whatsapp-new-lead-notification-message-client');

            foreach ($client->toArray() as $key => $value) {
                $message = str_replace('{{' . $key . '}}', $value, $message);
            }

            new Fetch(env('WA_URL') . '/api/send', [
                'method' => 'POST',
                'headers' => [
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json'
                ],
                'body' => [
                    'from' => 'atalaya-' . $business->uuid,
                    'to' => [
                        $client['country_prefix'] . $client['contact_phone']
                    ],
                    'content' => UtilController::html2wa($message)
                ]
            ]);
        } catch (\Throwable $th) {
            // dump($th);
        }
    }
    static function envioCorreoMundo($client)
    {
        $name = 'Administrador';
        $mail = EmailConfig::config($name); /* variable $name que se agregó */
        try {
            $mail->addAddress('hola@mundoweb.pe');
            $mail->Body = '<html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>Mundo web</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
                    <link
                        href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap"
                        rel="stylesheet"
                    />
                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }

                        @font-face {
                            font-family: grotesk;
                            src: url(../../public/fonts/PPRightGroteskCompactMedium.woff);
                            font-weight: normal;
                        }
                    </style>
                </head>
                <body>
                    <main>
                        <table
                            style="
                                width: 600px;
                                margin: 0 auto;
                                text-align: center;
                                background-image: url(https://mundoweb.pe/mail/Fondo.png);
                                background-repeat: no-repeat;
                                background-position: center;
                                background-size: cover;
                            "
                        >
                            <thead>
                                <tr>
                                    <th
                                        style="
                                            display: flex;
                                            flex-direction: row;
                                            justify-content: center;
                                            align-items: center;
                                            margin: 100px;
                                        "
                                    >
                                        <img src="https://mundoweb.pe/mail/Frame_14466.png" alt="mundo web" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <p
                                            style="
                                            color: #050a41;
                                            font-weight: 500;
                                            font-size: 18px;
                                            text-align: center;
                                            width: 500px;
                                            margin: 0 auto;
                                            padding: 20px 0;
                                            font-family: Montserrat, sans-serif;
                                        "
                                        >
                                             <span style="display:block">Hola </span>
                                            
                                            
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <p
                                            style="
                                                color: #e15a29;
                                                font-size: 40px;
                                                line-height: 20px;
                                                font-family: Montserrat, sans-serif;
                                            "
                                        >
                                             <span style="display:block">' . $name . ' </span>
                                            
                                            
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <p
                                            style="
                                                color: #e15a29;
                                                font-size: 40px;
                                                line-height: 70px;
                                                font-family: Montserrat, sans-serif;
                                            "
                                        >
                                            ¡Tienes
                                            <span style="color: #050a41"
                                                >un nuevo mensaje! 🚀</span
                                            >
                                        </p>
                                    </td>
                                </tr>
                                
                <tr>
                <td>
                    <a href="https://mundoweb.pe/" style="
                        text-decoration: none;
                        background-color: #e15a29;
                        color: white;
                        border-radius: 40px;
                        padding: 12px 20px;
                        display: inline-flex;
                        justify-content: center;
                        align-items: center;
                        gap: 10px;
                        font-weight: 600;
                        font-family: Montserrat, sans-serif;
                    ">
                        <span>Haz que tu negocio despegue</span>
                        <img  src="https://mundoweb.pe/mail/buttonmailing.png" style="
                            width: 20px;
                            margin-left: 15px;
                            height: 20px;
                        " />
                    </a>
                </td>
                </tr>
                <tr>
                    <td style="text-align: right; padding-right: 30px;">
                        <img src="https://mundoweb.pe/mail/10_rgb.png" alt="mundo web" style="width: 80%; margin-top: 100px" />
                    </td>
                </tr>
                </tbody>
                </table>
                </main>
                </body>

            </html>';
            $mail->isHTML(true);
            $mail->send();


            $message = SettingController::get('whatsapp-new-lead-notification-message');
            $destinatary = Text::keep(SettingController::get('whatsapp-new-lead-notification-waid'), '0123456789@gc.us');

            foreach ($client->toArray() as $key => $value) {
                $message = str_replace('{{' . $key . '}}', $value, $message);
            }

            new Fetch(env('WA_URL') . '/api/send', [
                'method' => 'POST',
                'headers' => [
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json'
                ],
                'body' => [
                    'from' => 'atalaya',
                    'to' => [$destinatary],
                    'content' => UtilController::html2wa($message)
                ]
            ]);
        } catch (\Throwable $th) {
            //throw $th;
        }
    }
}
