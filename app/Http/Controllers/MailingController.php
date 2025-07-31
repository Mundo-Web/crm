<?php

namespace App\Http\Controllers;

use SMTPValidateEmail\Validator;

class MailingController extends Controller
{
    static function isEmail(string $email)
    {
        return preg_match('/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/', $email);
    }
    static function isValid(string $email)
    {
        if (!MailingController::isEmail($email)) return false;

        $dominio = substr(strrchr($email, "@"), 1);
        if (!checkdnsrr($dominio, "MX")) return false;

        $validator = new Validator();
        $result = $validator->validate([$email], env('MAIL_FROM_ADDRESS'));

        return $result[$email];
    }
}
