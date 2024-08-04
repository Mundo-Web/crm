<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;

    static string $PUBLIC_RSA_KEY = '-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCozbqiP6kl4hoGatviSPkRoQRA
4ZRjGYe8PsVpXgcXD+VWzR8qdF1ae5j/WC3acIu4Hwuo5kfSewUPGGe05kCh3zUW
bEUNRtKjrojrhbbwrCovDxur1MI40mSLbAl1WlmUYhBZa9OMiTSnIe47jIRI2mS3
UUxBkQJfdWd7dZ/OOQIDAQAB
-----END PUBLIC KEY-----';
    static string $PRIVATE_RSA_KEY = '-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAKBgQCozbqiP6kl4hoGatviSPkRoQRA4ZRjGYe8PsVpXgcXD+VWzR8q
dF1ae5j/WC3acIu4Hwuo5kfSewUPGGe05kCh3zUWbEUNRtKjrojrhbbwrCovDxur
1MI40mSLbAl1WlmUYhBZa9OMiTSnIe47jIRI2mS3UUxBkQJfdWd7dZ/OOQIDAQAB
AoGAbs3Ug6o8EuTu5mWAfnIeJCdIjnpEmCRrB/NATGDvUIEbrrWojoqhuMJG9N3i
A3A7FpoyYiT+4jfkYztG3+UAaOqdPquj2L4F3TjaWbkvN+WJN/STUmvNWFJxl61g
aMpg1i661vueEurd3lNZCS9psfiPN82UcjXbTvC3eUPeav0CQQD+A2QFBnfae3zr
uKCVeZiLEz5UkLUCakrmzb9SVIlhxFaxIrACUtGG0DWeGM1HJLbpBDEOCCeft9qy
WFlpcD6HAkEAqh+5PdRRIcXGw29hKuvgYzV7scH5Uf2kZ5Tnd/Y8xebXfmAtBMKr
Nc2YDSvjOfvtNzQLq5nXsh6gU4B5IWP9PwJBAPvgrNt20H4rmXG8wC+4RZUS3enJ
HFRqxh8bwi2HejsiD7zSYqnLKc1+xMwiV9vGAkIJUANT/saX7xqOFQtCrB0CQFr6
Ag79hrGf2W5UFstkPqfvRwnFaLYfBRdbevkdFlzi2OS9O/XqwLJSEvkgOjCc97to
usD20XFwjV56OszPcvMCQDUNakuKlLmLxirva7uPBwh4yilf0NFwfqX66pWOiXaf
HPSRNrscbSim/ENvOhGnz74JOO1PlfJqzKHc8/2rFyI=
-----END RSA PRIVATE KEY-----';

    static function encode($string): string
    {
        $encrypted = '';
        openssl_public_encrypt($string, $encrypted, Controller::$PUBLIC_RSA_KEY);
        return base64_encode($encrypted);
    }

    static function decode($string): string
    {
        $decrypted = '';
        openssl_private_decrypt(base64_decode($string), $decrypted, Controller::$PRIVATE_RSA_KEY);
        return $decrypted;
    }
}
