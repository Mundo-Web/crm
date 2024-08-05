<?php

namespace App\Http\Classes;

use PHPMailer\PHPMailer\PHPMailer;

class EmailConfig
{
    public static function config(): PHPMailer
    {
        $mail = new PHPMailer(true);
        // $mail->SMTPDebug = SMTP::DEBUG_SERVER;
        $mail->isSMTP();
        $mail->Host = env('MAIL_HOST');
        $mail->SMTPAuth = true;
        $mail->Username = env('MAIL_USERNAME');
        $mail->Password = env('MAIL_PASSWORD');
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port = env('MAIL_PORT');
        $mail->Subject = 'Notificación de ' . env('APP_NAME');
        $mail->CharSet = 'UTF-8';
        $mail->setFrom(env('MAIL_FROM_ADDRESS'), env('MAIL_FROM_NAME'));
        return $mail;
    }
}
