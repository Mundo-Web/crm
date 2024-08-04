@php
  $route = Route::currentRouteName();
  $component = Router::components[$route];
@endphp

<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <title>Login | Atalaya</title>
  <link rel="shortcut icon" href="/assets/img/icon.svg" type="image/png">

  @vite('resources/js/' . $component['component'])
  @inertiaHead

  <style>
    .tippy-tooltip {
      padding: 0;
    }

    .dx-datagrid-content .dx-datagrid-table .dx-row>td {
      vertical-align: middle;
    }
  </style>
</head>

<body class="loading"
  data-layout='{"mode": "light", "width": "fluid", "menuPosition": "fixed", "sidebar": { "color": "light", "size": "default", "showuser": true}, "topbar": {"color": "light"}, "showRightSidebarOnPageLoad": false}'>
  @inertia
  <script src="/lte/assets/libs/gsap/gsap.min.js"></script>
  <script src="/lte/assets/libs/gsap/ScrollTrigger.min.js"></script>
  <script src="/assets/js/yeti.js?v=06d3ebc8-645c-4d80-a600-c9652743c425"></script>
</body>

</html>
