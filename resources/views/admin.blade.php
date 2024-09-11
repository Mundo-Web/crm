@php
  $route = Route::currentRouteName();
@endphp

<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <title>Gestion de clientes | Atalaya</title>
  <link rel="shortcut icon" href="/assets/img/icon.svg" type="image/png">

  <link href="/lte/assets/libs/select2/css/select2.min.css" rel="stylesheet" type="text/css" />

  {{-- QuillJs Styles --}}
  <link href="/lte/assets/libs/quill/quill.snow.css" rel="stylesheet" type="text/css" />
  <link href="/lte/assets/libs/quill/quill.bubble.css" rel="stylesheet" type="text/css" />
  <link href="/lte/assets/libs/quill/quill.mention.css" rel="stylesheet" type="text/css">

  {{-- DxDataGrid Styles --}}
  <link href="/lte/assets/libs/dxdatagrid/css/dx.light.compact.css?v=06d3ebc8-645c-4d80-a600-c9652743c425"
    rel="stylesheet" type="text/css" id="dg-default-stylesheet" />
  <link href="/lte/assets/libs/dxdatagrid/css/dx.dark.compact.css?v=06d3ebc8-645c-4d80-a600-c9652743c425"
    rel="stylesheet" type="text/css" id="dg-dark-stylesheet" disabled="disabled" />

  {{-- Bootstrap Styles --}}
  <link href="/lte/assets/css/config/default/bootstrap.min.css" rel="stylesheet" type="text/css"
    id="bs-default-stylesheet" />
  <link href="/lte/assets/css/config/default/bootstrap-dark.min.css" rel="stylesheet" type="text/css"
    id="bs-dark-stylesheet" disabled="disabled" />

  {{-- App Styles --}}
  <link href="/lte/assets/css/config/default/app.css" rel="stylesheet" type="text/css" id="app-default-stylesheet" />
  <link href="/lte/assets/css/config/default/app-dark.css" rel="stylesheet" type="text/css" id="app-dark-stylesheet"
    disabled="disabled" />

  {{-- icons --}}
  <link href="/lte/assets/css/icons.min.css" rel="stylesheet" type="text/css" />

  @vite('resources/js/' . $route)
  @inertiaHead

  <style>
    .tippy-tooltip {
      padding: 0;
    }

    .dx-datagrid-content .dx-datagrid-table .dx-row>td {
      vertical-align: middle;
    }

    .dropdown-menu {
      box-shadow: 0 0 20px rgba(51, 51, 51, .125)
    }

    .dropdown-menu-center {
      left: 50% !important;
      transform: translate(-50%, 0) !important;
    }

    .mention {
      color: #71b6f9;
      background-color: rgba(187, 187, 187, .25)
    }

    .ql-mention-list-container {
      width: max-content;
    }

    .ql-mention-list-item {
      padding: 8px 16px;
      line-height: unset;

    }

    .ql-editor {
      color: #6c757d;
    }
  </style>
  <link rel="stylesheet" href="/assets/css/send2div.css">
  <link rel="stylesheet" id="send-to-div-style" href="" />
</head>

<body class="loading"
  data-layout='{"mode": "horizontal", "width": "fluid", "menuPosition": "fixed", "sidebar": { "color": "light", "size": "default", "showuser": true}, "topbar": {"color": "light"}, "showRightSidebarOnPageLoad": false}'>
  @inertia

  <span id="icon-2-send" class="fas"></span>

  <div class="rightbar-overlay"></div>
  <script src="/lte/assets/libs/qrcodejs/qrcode.min.js"></script>
  <!-- Extends js -->
  <script src="/assets/js/file.extend.js"></script>
  <script src="/assets/js/storage.extend.js"></script>

  <!-- Vendor js -->
  <script src="/lte/assets/js/vendor.min.js"></script>

  @if ($route == 'Home.jsx')
    <script src="/lte/assets/libs/jquery-knob/jquery.knob.min.js"></script>
  @elseif($route == 'Calendar.jsx')
    <link href="/lte/assets/libs/fullcalendar/main.min.css" rel="stylesheet" type="text/css" />
    <script src="/lte/assets/libs/fullcalendar/main.min.js"></script>
  @elseif ($route == 'Leads.jsx')
    <script src="/lte/assets/libs/jquery-ui/jquery-ui.min.js"></script>
  @endif
  <script src="/lte/assets/libs/quill/quill.min.js"></script>
  <script src="/lte/assets/libs/quill/quill.mention.min.js"></script>
  <script src="/lte/assets/libs/select2/js/select2.full.min.js"></script>
  <script src="/lte/assets/libs/tippy.js/tippy.all.min.js"></script>

  <!-- App js -->
  <script src="/lte/assets/js/app.js?v={{ uniqid() }}"></script>

  <script src="/lte/assets/libs/dxdatagrid/js/dx.all.js"></script>
  <script src="/lte/assets/libs/dxdatagrid/js/localization/dx.messages.es.js"></script>
  {{-- <script src="/lte/assets/libs/dxdatagrid/js/localization/dx.messages.en.js"></script> --}}
  <script src="/lte/assets/libs/moment/min/moment.min.js"></script>
  <script src="/lte/assets/libs/moment/moment-timezone.js"></script>
  <script src="/lte/assets/libs/moment/locale/es.js"></script>
</body>

</html>
