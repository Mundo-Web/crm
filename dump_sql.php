<?php
$mysqli = new mysqli("127.0.0.1", "root", "The3sc@r@B@j0s", "crm_db");
if ($mysqli->connect_errno) {
    echo "Failed to connect to MySQL: " . $mysqli->connect_error;
    exit();
}

$res = $mysqli->query("SELECT * FROM integrations WHERE business_id = 35 AND meta_service = 'whatsapp'");
$row = $res->fetch_assoc();
if ($row) {
    foreach ($row as $k => $v) {
        if ($k == 'meta_access_token') $v = substr($v, 0, 10) . "...";
        echo "$k: $v\n";
    }
} else {
    echo "Integration 35 NOT FOUND in crm_db\n";
}

// In production, the main DB might be different. Let's try atalaya if it exists.
if ($mysqli->select_db("atalaya")) {
    $res = $mysqli->query("SELECT uuid, name FROM businesses WHERE id = 35");
    $row = $res->fetch_assoc();
    if ($row) {
        echo "UUID Business: " . $row['uuid'] . "\n";
        echo "Name Business: " . $row['name'] . "\n";
    }
}
