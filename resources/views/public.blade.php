@php
    $route = Route::currentRouteName();
@endphp

<!DOCTYPE html>
<html lang="es">

<head>
    @viteReactRefresh
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">

    <title>Atalaya CRM</title>

    <link rel="shortcut icon" href="/assets/img/icon.svg" type="image/png">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap"
        rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Fresca&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap" rel="stylesheet">

    <style>
        * {
            margin: 0;
            padding: 0;
            font-family: "Nunito Sans", serif;
            box-sizing: border-box;
        }

        .font-emoji {
            font-family: "Noto Color Emoji", sans-serif;
        }
    </style>

    <link href="/lte/assets/css/icons.min.css" rel="stylesheet" type="text/css" />

    <script src="lte/assets/libs/particles.js/main.js"></script>
    {{-- <script src="http://threejs.org/examples/js/libs/stats.min.js"></script> --}}

    @vite(['resources/css/app.css', 'resources/js/' . $route])
    @inertiaHead
</head>

<body>
    @inertia
</body>

</html>
