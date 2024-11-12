<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Página en Mantenimiento</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #ffffff;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      color: #333333;
    }

    .container {
      text-align: center;
      max-width: 600px;
      padding: 0 20px;
    }

    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
      font-weight: normal;
    }

    p {
      font-size: 1rem;
      line-height: 1.5;
      margin-bottom: 2rem;
    }

    .loader {
      width: 100px;
      height: 2px;
      background-color: #eeeeee;
      margin: 0 auto;
      position: relative;
      overflow: hidden;
    }

    .loader::after {
      content: '';
      position: absolute;
      left: -100px;
      height: 2px;
      width: 100px;
      background-color: #333333;
      animation: loading 2s linear infinite;
    }

    @keyframes loading {
      0% {
        left: -100px;
      }

      100% {
        left: 100%;
      }
    }

    @media (max-width: 600px) {
      h1 {
        font-size: 1.5rem;
      }

      p {
        font-size: 0.9rem;
      }
    }
  </style>
</head>

<body>
  <div class="container">
    <h1>{{ $title ?? 'Espere un momento por favor' }}</h1>
    @if ($description)
      <p>{{ $description }}</p>
    @endif
    <div class="loader"></div>
  </div>
  <script src="/assets/js/storage.extend.js"></script>
  <script>
    Local.set('{{ $key }}', '{{ $value }}')
  </script>
</body>

</html>
